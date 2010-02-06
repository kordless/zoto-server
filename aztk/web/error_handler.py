"""
dyn_pages/error_handler.py

Author: Josh Williams
Date Added: Thu Feb 22 10:21:00 CST 2007

Generic error handler for the site.
"""

## STD LIBS
import traceback

## OUR LIBS
from zoto_base_page import zoto_base_page
import errors, aztk_config

## 3RD PARTY LIBS
from zope.interface import implements
from nevow import inevow, loaders, tags as T
from twisted.web import http

class error_handler(zoto_base_page):
	implements(inevow.ICanHandleException)

	def renderHTTP_exception(self, ctx, failure):
		self.failure = failure
		self.request = inevow.IRequest(ctx)
		self.renderHTTP(ctx)
		self.request.finishRequest(False)

	def render_content(self, ctx, data):
		ctx.fillSlots('header_bar', self.anon_header)
		ctx.fillSlots('top_bar', T.div(id=""))
		if isinstance(self.failure.value, errors.PermissionDenied):
			error_text = T.div()[
				T.br(),
				T.h3[
					T.img(src="/image/error.png"),
					T.span[" hey! this stuff is private"]
				],
				T.br(),
				T.div()[
					"Sorry.  The contents of this page aren't for public consumption."
				],
				T.br(),
				T.div()[
					"If you think you should have access to this area you can email us at ",
					T.a(href="mailto:support@zoto.com")[ " support@zoto.com "],
					" or search our ",
					T.a(href="http://forums.zoto.com")[ " forums"],
					"."
				]
			]
		else:
			## APIError
			## AsyncStack
			self.request.setResponseCode(http.INTERNAL_SERVER_ERROR)
			if aztk_config.setup.get('site', 'environment') in ('sandbox', 'development'):
				error_text = T.div()[
					T.span[self.failure.getErrorMessage()],
					T.br(),
					T.span[self.failure.getBriefTraceback()]
				]
			else:
				#error_text = T.div["Internal error"]
				error_text = T.div()[
					T.br(),
					T.h3[
						T.img(src="/image/error.png"),
						T.span[" something has gone horribly wrong"]
					],
					T.br(),
					T.div()[
						"It looks like we are experiencing some technical difficulty displaying items on this page. " \
						"Please try to refresh the page. "\
						"If the problem persists contact us and let us know. "					
					],
					T.br(),
					T.div()[
						"Thanks for your patience. If you have any questions you can email us at ",
						T.a(href="mailto:support@zoto.com")[ " support@zoto.com "],
						" or search our ",
						T.a(href="http://forums.zoto.com")[ " forums"],
						"."
					]
				]

		ctx.fillSlots('main_content', loaders.stan(
			T.div(id="error_box")[
				error_text
			]

		))
		return ctx.tag
