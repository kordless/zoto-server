"""
Benchmarks Image Resizing

benchmark_images.py
Ken Kinder
2005-03-21
"""

from testing_common import *
import time, imagemanip, time, thread, sys

test_cases = []
for x, w1, h1, w2, h2 in [(1, 8000, 6000, 640, 480),
						  (2, 4000, 3000, 640, 480),
						  (3, 800, 600, 640, 480),
						  (4, 640, 480, 120, 120)]:
	test_cases.append((x, generate_unique_image(w1, h1), w1, h1, w2, h2))

total_start = time.time()

benchmarks = {}
ticks = {'PIL': 0, 'Hybrid': 0}
global current_library
global stop_thread
current_library = ''
stop_thread = False

def sleeper():
	while 1:
		if stop_thread:
			thread.exit()
		if current_library:
			ticks[current_library] += 1
			sys.stdout.write('.')
			sys.stdout.flush()
			time.sleep(.5)
thread.start_new_thread(sleeper, ())

for library in ("Hybrid", "PIL"):
	print library,
	current_library = library
	imagemanip.install(library)
	benchmarks[library] = {}

	for x, binary, start_width, start_height, end_width, end_height in test_cases:
		# Thumbmailing
		start = time.time()
		sized = imagemanip.manip_nodefer.thumbnail(binary, end_width, end_height)
		stop = time.time()
		benchmarks[library]['%s. Thumb: %sx%s to %sx%s' % (x, start_width, start_height, end_width, end_height)] = stop - start
		
		# Fitting
		start = time.time()
		sized = imagemanip.manip_nodefer.fit(binary, end_width, end_height)
		stop = time.time()
		benchmarks[library]['%s. Fit:   %sx%s to %sx%s' % (x, start_width, start_height, end_width, end_height)] = stop - start
	print

total_stop = time.time()
current_library = ''
stop_thread = True

keys = benchmarks.keys()
keys.sort()
for library in keys:
	tests = benchmarks[library].keys()
	tests.sort()
	for test in tests:
		print '%15s %30s: %s' % (library, test, benchmarks[library][test])

print "Expected ticks:", (total_stop - total_start) * 2
print ticks
