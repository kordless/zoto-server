"""
A library to create instances of objects from a standardized package. Examples
of this are apis and servers.

InstancePackage.py
Ken Kinder
2004-03-02
"""

class InstancePackage(object):
	"""
	InstancePackage takes a package with a collection of classes in
	it, instanciates instances of those classes, and makes those
	instances object attributes on the InstancePackage, ugh, instance.
	"""
	def __init__(self, package, enabled_modules, superclass, *args,
				 **kwargs):
		"""
		@param package: Package to get instances from
		
		@type package: Package

		@param enabled_modules: A list of modules in
		package to enable.

		@type enabled_modules: List of strings

		@param superclass: Only subclasses of this class will
		be instanciated and included.

		@type superclass: Class

		Additional arguments and keyword arguments are passed to
		the constructors of the modules.
		"""
		self.package = package
		self.enabled_modules = enabled_modules
		self.superclass = superclass
		
		for module_name in enabled_modules:
			module_name = module_name.strip()
			module_class = getattr(package, module_name)

			if not issubclass(module_class, superclass):
				raise ValueError, '%s it not a sublcass of %s' % \
					  (module_class, superclass)
			instance = module_class(*args, **kwargs)

			setattr(self, module_name.lower(), instance)
		self.__name__ = package.__name__

class APIInstancePackage(InstancePackage):
	"""
	Instance Package for the API
	"""
	def __init__(self, *args, **kwargs):
		InstancePackage.__init__(self, *args, **kwargs)

class ServerInstancePackage(InstancePackage):
	"""
	Instance package for the servers.
	"""
	def __init__(self, *args, **kwargs):
		InstancePackage.__init__(self, *args, **kwargs)
