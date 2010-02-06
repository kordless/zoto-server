"""
lib/imagemanip.py

Author: Josh Williams (w/ Trey Stout)
Date Added: Fri Nov 18 16:05:04 CST 2005

Wrapper module to handle low-level image manipulation
"""
## STD LIBS
from cStringIO import StringIO
from pprint import pformat
from subprocess import call
import os, tempfile

## OUR LIBS
from constants import *
import validation, errors, aztk_config

## 3RD PARTY LIBS
from twisted.internet import utils
from twisted.internet import threads
from twisted.internet.defer import Deferred
from PIL import Image
import EXIF

class ImageManip(object):
	"""
	This class wraps several external bits of software (currently mogrify, PIL, and 
	the EXIF parsing library) to allow manipulation of images and extraction
	of header information from them.
	"""
	def __init__(self):
		# use the local tmp folder (should be a symlink to the ramdrive /dev/shm)
		self.temp_dir = aztk_config.setup.get('paths', 'image_temp')
		self.converter_bin = '/usr/bin/convert'
		self.resize_filter_large = 'lanczos' # see the -filter argument to ImageMagick's convert tool for more options
		self.resize_filter_small = 'lanczos' # we are using lanczos on all images now - leave this alone!!!
		self.blocking = False

	def _do_exec(self, cmd, args, filename):
		if self.blocking:
			retval = call([cmd]+ args)
			return self._handle_process_run(retval, filename, args)
		else:
			d = utils.getProcessValue(cmd, args)
			d.addCallback(self._handle_process_run, filename, args)
			d.addErrback(self._handle_failure)
			return d

	def _handle_process_run(self, val, filename, args):
		"""
		Takes care of finalizing an image manipulation call.

		@param val: Return value of the call
		@type val: Integer

		@param filename: Name of the file containing image output
		@type filename: String
		"""
		if val == 0:
			f = open(filename+".out")
			rval = f.read()
			f.close()
			try:
				os.remove(filename)
				os.remove(filename+".out")
			except:
				# who cares, we'll remove it later
				print "error removing %s" % filename
			return rval
		else:
			print "process returned non-zero exit status: %s" % val
			print "args: %s" % pformat(args)
			raise Exception, "ON NO!"

	def _handle_failure(self, failure):
		print "Bad juju: %s" % failure.getErrorMessage()
		raise Exception, "OH NO! OMG THE HUMANITY!"

	def _make_tempfile(self, data, method):
		"""
		Make a new tempfile for the about to be converted image
		
		@param data: Raw image data
		@type data: String

		@param method: The name of the method this tempfile is for
		@type method: String

		@return: absolute path of the new tempfile
		@rtype: String
		"""
		filename = tempfile.mktemp('_%s.jpg' % method, dir=self.temp_dir)
		# write out our data to a temp file, to be read by the converter command
		f = open(filename, 'w')
		f.write(data)
		f.close()

		# touch our "out" file that the converter will write the new image data to
		f = open(filename+".out", "w")
		f.close()
		return filename
		
	
	def _extract_coord(self, exif, coord):
		"""
		Extracts a specific GPS coordinate from the given EXIF data.
		
		@param exif: EXIF data extracted from a photo
		@type exif: String

		@param coord: GPS coordinate to extract
		@type coord: String

		@return: Value of the coordinate as a decimal
		@rtype: Float
		"""

		if coord == 'latitude':
			data_record = 'GPS GPSLatitude'
			orientation_record = 'GPS GPSLatitudeRef'
		elif coord == 'longitude':
			data_record = 'GPS GPSLongitude'
			orientation_record = 'GPS GPSLongitudeRef'
		elif coord == 'altitude':
			data_record = 'GPS GPSAltitude'
			orientation_record = None
		else:
			raise ValueError, 'Invalid coordinate: %s' % coord

		value = 0
		if exif.has_key(data_record):
			# If we don't have the orientation, the data is useless.
			if coord == 'altitude':
				value = str(exif[data_record])
				if value:
					value = int(value)
				else:
					value = 0
			else:
				assert(exif.has_key(orientation_record))
				exif_record = exif[data_record]
				
				degrees, minutes, seconds = exif_record.values
				value = float(degrees) + (float(minutes)/60.0) + (float(seconds)/3600.0)
				if str(exif[orientation_record]) in ('W', 'S'):
					value = -value
			
		return value

	def _get_exif(self, image):
		"""
		Extracts the exif information from the given photo

		@param image: Raw image data
		@type image: String

		@return: Exif information
		@rtype: Dictionary
		"""
		try:
			obj = Image.open(StringIO(image))
		except (IOError, ValueError):
			raise errors.UnsupportedFileError

		try:
			exif = validation.exifdata(obj._getexif())
		except:
			exif = {}
		if not exif: exif = {}
		return exif

	def _verify_jpeg(self, image):
		"""
		Verifies that the given photo is a valid jpeg image

		@param image: Raw image data
		@type image: String

		@return: None (raises an exception if the photo is not a jpeg)
		"""
		try:
			obj = Image.open(StringIO(image))
		except (IOError, ValueError):
			raise errors.UnsupportedFileError
	
		if obj.format != 'JPEG':
			raise errors.UnsupportedFileError
		return image
	
	def _get_dimensions(self, image):
		"""
		Gets the dimensions (width/height) of the given photo

		@param image: Raw image data
		@type image: String

		@return: Width and height of the photo
		@rtype: Tuple (int, int)
		"""
		try:
			obj = Image.open(StringIO(image))
		except (IOError, ValueError):
			raise errors.UnsupportedFileError
		(x, y) = obj.size
		return x, y

	def _extract_gps(self, image):
		"""
		Extracts the GPS coordinates (if present) from the given photo

		@param image: Raw image data
		@type image: String

		@return: GPS coordinates from the exif
		@rtype: Tuple (float, float, float)
		"""
		try:
			image = StringIO(image)
			exif = EXIF.process_file(image)
			return (self._extract_coord(exif, 'latitude'), self._extract_coord(exif, 'longitude'), self._extract_coord(exif, 'altitude'))
		except:
			return (0, 0, 0)

	def resize_no_crop(self, image, width, height, quality):
		"""
		resize within the specified dimensions (new image may not be exactly the requested size
		but will "fit" inside it)
		
		@param data: Raw image data
		@type data: String

		@param width: number of horizontal pixels that the new image should fit inside
		@type width: String
		
		@param height: number of vertical pixels that the new image should fit inside
		@type height: String

		@return: converted raw image data
		@rtype: (Deferred) string
		"""
		filename = self._make_tempfile(image, "resize_no_crop")
		args = []
		args += [filename]

		if (width * height) > 32768:
			args += ['-filter', self.resize_filter_large]
			resize_or_thumbnail = '-resize'
		else:
			args += ['-filter', self.resize_filter_small]
			# thumbnail will strip EXIF fluff, and is faster than resize
			resize_or_thumbnail = '-thumbnail'

		args += ['-quality', str(quality)]
		args += [resize_or_thumbnail, '%sx%s' % (width, height)]
		#args += ['-modulate', '%s,%s,%s' % ("100", "105", "100")]
		args += ['-unsharp', '%sx%s+%s+%s' % ("1.2", "1", ".50", "0.02")]
		args += [filename+".out"]

		return self._do_exec(self.converter_bin, args, filename)
		#d = utils.getProcessValue(self.converter_bin, args)
		#d.addCallback(self._handle_process_run, filename, args)
		#d.addErrback(self._handle_failure)
		#return d
		
	def resize_crop(self, image, width, height, quality):
		"""
		resize a file to exact width height.

		@param image: Raw image data
		@type image: String

		@param width: New width of the image
		@type width: Integer

		@param height: New height of the image
		@type height: Integer

		@return: Converted raw image data
		@rtype: Deferred (String)
		"""

		# use PIL to get the existing size of the image...
		data = StringIO(image)
		img = Image.open(data)
		data.close()
		original_width, original_height = img.size

		filename = self._make_tempfile(image, "resize_crop")
		args = []
		args += [filename]

		if (width * height) > 32768:
			args += ['-filter', self.resize_filter_large]
			resize_or_thumbnail = '-resize'
		else:
			args += ['-filter', self.resize_filter_small, '-strip']
			resize_or_thumbnail = '-thumbnail'

		args += ['-quality', str(quality)]

		original_aspect = float(original_width) / float(original_height)
		aspect = float(width) /float(height)

		if original_width < original_height:
			# portrait - crop off 5%
			if aspect < original_aspect: 
				args += [resize_or_thumbnail, 'x%s' % (height+height/20)]
			else:
				args += [resize_or_thumbnail, '%sx' % (width+width/20)]
		else: 
			# landscape or square - crop off 5%
			if aspect > original_aspect: 
				args += [resize_or_thumbnail, '%sx' % (width+width/20)]
			else:
				args += [resize_or_thumbnail, 'x%s' % (height+height/20)]

		#args += ['-modulate', '%s,%s,%s' % ("100", "105", "100")]
		args += ['-unsharp', '%sx%s+%s+%s' % ("1.2", "1", ".50", "0.02")]
		args += ['-gravity', 'center']
		args += ['-crop', '%sx%s+0+0' % (width, height)]
		args += [filename+".out"]

		return self._do_exec(self.converter_bin, args, filename)
		#d = utils.getProcessValue(self.converter_bin, args)
		#d.addCallback(self._handle_process_run, filename, args)
		#d.addErrback(self._handle_failure)
		#return d
		
	def normalize(self, image):
		"""
		Performs contrast/color balancing on an image

		@param image: Raw image data
		@type image: String

		@return: Converted raw image data
		@rtype: Deferred (String)
		"""
		filename = self._make_tempfile(image, "normalize")
		args = ['-equalize', filename, filename+".out"]
		return self._do_exec(self.converter_bin, args, filename)
		#d = utils.getProcessValue(self.converter_bin, args)
		#d.addCallback(self._handle_process_run, filename, args)
		#d.addErrback(self._handle_failure)
		#return d
	
	def annotate(self, image, x, y, text):
		"""
		Adds text to an image at the given position

		@param image: Raw image data
		@type image: String

		@param x: x-coordinate
		@type x: Integer

		@param y: y-coordinate
		@type y: Integer

		@param text: Text to be added
		@type text: String

		@return: Converted raw image data
		@rtype: Deferred (String)
		"""

		filename = self._make_tempfile(image, "annotate")
		args = [
			'-annotate', '+%s+%s' % (x,y),
			text,
			filename,
			filename+".out"
		]
		return self._do_exec(self.converter_bin, args, filename)
		#d = utils.getProcessValue(self.converter_bin, args)
		#d.addCallback(self._handle_process_run, filename, args)
		#d.addErrback(self._handle_failure)
		#return d
	
	def rotate(self, image, direction):
		"""
		Rotates an image 90, 180, or 270 degrees.

		@param image: Raw image data
		@type image: String

		@param direction: Number of degrees to rotate
		@type direction: Integer

		@return: Converted raw image data
		@rtype: Deferred (String)
		"""
		filename = self._make_tempfile(image, "rotate")
		args = ['-rotate', '%d' % direction, filename, filename+".out"]
		return self._do_exec(self.converter_bin, args, filename)
		#d = utils.getProcessValue(self.converter_bin, args)
		#d.addCallback(self._handle_process_run, filename, args)
		#d.addErrback(self._handle_failure)
		#return d

	def flip(self, image):
		"""
		Flips an image top->bottom.

		@param image: Raw image data
		@type image: String

		@return: Converted raw image data
		@rtype: Deferred (String)
		"""
		filename = self._make_tempfile(image, "flip")
		args = ['-flip']
		return self._do_exec(self.converter_bin, args, filename)

	def flop(self, image):
		"""
		Flops an image left->right.

		@param image: Raw image data
		@type image: String

		@return: Converted raw image data
		@rtype: Deferred (String)
		"""
		filename = self._make_tempfile(image, "flop")
		args = ['-flop']
		return self._do_exec(self.converter_bin, args, filename)

	def get_exif(self, image):
		return threads.deferToThread(self._get_exif, image)	

	def verify_jpeg(self, image):
		return threads.deferToThread(self._verify_jpeg, image)	

	def get_dimensions(self, image):
		return threads.deferToThread(self._get_dimensions, image)	

	def extract_gps(self, image):
		return threads.deferToThread(self._extract_gps, image)

manip = ImageManip()
