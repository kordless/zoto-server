/*============================================================================*
 *                                                                            *
 *	This file is part of the Zoto Software suite.  							  *
 *																			  *
 *	Copyright (C) 2004 Zoto, Inc.  123 South Hudson, OKC, OK  73102			  *
 *																			  *
 *	Original algorithms taken from RFC 1321									  *
 *	Copyright (C) 1990-2, RSA Data Security, Inc.							  *
 *																			  *
 *============================================================================*/
#include <Python.h>
#include "structmember.h"
#include "ZTypes.h"

/* MACROS */
#define SET_ERROR( msg ) { PyErr_SetString(PyExc_TypeError, msg ); }

/*============================================================================*
 *                      O B J E C T   D A T A   M E M B E R S				  *
 *============================================================================*/
typedef struct
{
	PyObject_HEAD
	int				type;
	unsigned short	length;
	unsigned short	return_code;
	PyObject		*response;
} zsp_auth_resp;

/*============================================================================*
 *    C R E A T I O N / I N I T I A L I Z A T I O N / D E S T R U C T I O N   *
 *============================================================================*/
static PyObject *
zsp_auth_resp_new(PyTypeObject *type, PyObject *args, PyObject *kwds)
{
	zsp_auth_resp *self;

	self = (zsp_auth_resp *)type->tp_alloc(type, 0);
	if (self != NULL)
	{
		//==================================//
		// Initialize all object variables  //
		//==================================//
		self->response = PyString_FromString("");
		if (self->response == NULL)
		{
			Py_DECREF(self);
			return NULL;
		}

		self->type = ZSP_NONE;
		self->length = 0;
		self->return_code = 0;
	}

	return (PyObject *)self;
}

static int
zsp_auth_resp_init(zsp_auth_resp *self, PyObject *args, PyObject *kwds)
{
	return 0;
}

static void
zsp_auth_resp_dealloc(zsp_auth_resp *self)
{
	Py_XDECREF(self->response);
	self->ob_type->tp_free((PyObject*)self);
}


/*============================================================================*
 *                      G E T T E R S / S E T T E R S                         *
 *============================================================================*/
static PyObject *
zsp_auth_resp_get_response(zsp_auth_resp *self, void *closure)
{
	Py_INCREF(self->response);
	return self->response;
}

static int
zsp_auth_resp_set_response(zsp_auth_resp *self, PyObject *value, void *closure)
{
	if (value == NULL)
	{
		SET_ERROR("Cannot delete response attribute");
		return -1;
	}

	if (!PyString_Check(value))
	{
		SET_ERROR("The response attribute value must be a string");
		return -1;
	}

	Py_DECREF(self->response);
	Py_INCREF(value);
	self->response = value;

	return 0;
}

static PyObject *
zsp_auth_resp_parse(zsp_auth_resp *self, PyObject *args)
{
	unsigned char			*raw;
	ZSP_AUTH_RESP_PACKET	*auth_resp;
	int						auth_resp_length = 0;
	char					buffer[128];
	int						response_length;

	if (!PyArg_ParseTuple(args, "s#", &raw, &auth_resp_length))
		return NULL;

	auth_resp = (ZSP_AUTH_RESP_PACKET *)raw;

	self->type		= auth_resp->header.packet_type;
	self->length	= ntohs(auth_resp->header.payload_length);

	/* check the length */
	if (auth_resp_length < (self->length + HEADER_SIZE))
		return NULL;

	/* return_code */
	self->return_code = ntohs(auth_resp->return_code);

	/* response string */
	memset(buffer, '\0', sizeof(buffer));
	memcpy(buffer, &raw[AUTH_RESP_SIZE],
			auth_resp_length - AUTH_RESP_SIZE);
	self->response = PyString_FromString(buffer);

	return Py_BuildValue("i", 1);
}

static PyObject *
zsp_auth_resp_build(zsp_auth_resp *self, PyObject *args)
{
	ZSP_AUTH_RESP_PACKET	*auth_resp;
	unsigned short			payload_length;
	unsigned char			*raw;
	char					*response;
	int						response_length;
	PyObject				*retval;

	response = PyString_AsString(self->response);
	response_length = PyString_Size(self->response);
	raw = (unsigned char *)calloc(AUTH_RESP_SIZE + response_length, 1);

	auth_resp = (ZSP_AUTH_RESP_PACKET *)raw;

	payload_length = AUTH_RESP_SIZE - HEADER_SIZE + response_length;

	auth_resp->header.packet_type = ZSP_AUTH_RESP;
	auth_resp->header.payload_length = htons(payload_length);
	auth_resp->return_code = htons(self->return_code);

	memcpy(&raw[AUTH_RESP_SIZE], response, response_length);

	retval = Py_BuildValue("s#", raw, AUTH_RESP_SIZE + response_length);

	free(raw);

	return retval;
}

static PyMethodDef zsp_auth_resp_methods[] = {
	{"parse", (PyCFunction)zsp_auth_resp_parse, METH_VARARGS,
		"Parses the incoming ZSP authorization packet"},
	{"build", (PyCFunction)zsp_auth_resp_build, METH_VARARGS,
		"Builds the actual raw packet for transmission"},
	{NULL} /* Sentinel */
};
/*==============================*
 *      TYPE DATA MEMBERS		*
 *==============================*/
static PyMemberDef zsp_auth_resp_members[] = {
	{"type", T_INT, offsetof(zsp_auth_resp, type), 0,
		"payload type"},
	{"length", T_INT, offsetof(zsp_auth_resp, length), 0,
		"payload length"},
	{"return_code", T_USHORT, offsetof(zsp_auth_resp, return_code), 0,
		"return code"},
	{NULL} /* Sentinel */
};

static PyGetSetDef zsp_auth_resp_getseters[] = {
	{"response",
		(getter)zsp_auth_resp_get_response,
		(setter)zsp_auth_resp_set_response,
		"response text",
		NULL},
	{NULL} /* Sentinel */
};


static PyTypeObject zsp_auth_resp_type = {
	PyObject_HEAD_INIT(NULL)
	0,											/* ob_size */
	"zsp_packets.zsp_auth_resp",				/* tp_name */
	sizeof(zsp_auth_resp),						/* tp_basicsize */
	0,											/* tp_itemsize */
	(destructor)zsp_auth_resp_dealloc,			/* tp_dealloc */
	0,											/* tp_print */
	0,											/* tp_getattr */
	0,											/* tp_setattr */
	0,											/* tp_compare */
	0,											/* tp_repr */
	0,											/* tp_as_number */
	0,											/* tp_as_sequence */
	0,											/* tp_as_mapping */
	0,											/* tp_hash */
	0,											/* tp_call */
	0,											/* tp_str */
	0,											/* tp_getattro */
	0,											/* tp_setattro */
	0,											/* tp_as_buffer */
	Py_TPFLAGS_DEFAULT | Py_TPFLAGS_BASETYPE,	/* tp_flags */
	"ZSP Authorization Response packet",		/* tp_doc */
	0,											/* tp_traverse */
	0,											/* tp_clear */
	0,											/* tp_richcompare */
	0,											/* tp_weaklistoffset */
	0,											/* tp_iter */
	0,											/* tp_iternext */
	zsp_auth_resp_methods,						/* tp_methods */
	zsp_auth_resp_members,						/* tp_members */
	zsp_auth_resp_getseters,					/* tp_getset */
	0,											/* tp_base */
	0,											/* tp_dict */
	0,											/* tp_descr_get */
	0,											/* tp_descr_set */
	0,											/* tp_dictoffset */
	(initproc)zsp_auth_resp_init,				/* tp_init */
	0,											/* tp_alloc */
	zsp_auth_resp_new,							/* tp_new */
};

void initialize_zsp_auth_resp(PyObject *m)
{
	if (PyType_Ready(&zsp_auth_resp_type) < 0)
		return;

	Py_INCREF(&zsp_auth_resp_type);
	PyModule_AddObject(m, "zsp_auth_resp", (PyObject *)&zsp_auth_resp_type);
}

