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
	unsigned short	type;
	unsigned short	length;
	unsigned short	return_code;
	PyObject	*comment;
} zsp_version_resp;

/*============================================================================*
 *    C R E A T I O N / I N I T I A L I Z A T I O N / D E S T R U C T I O N   *
 *============================================================================*/
static PyObject *
zsp_version_resp_new(PyTypeObject *type, PyObject *args, PyObject *kwds)
{
	zsp_version_resp *self;

	self = (zsp_version_resp *)type->tp_alloc(type, 0);
	if (self != NULL)
	{
		//==================================//
		// Initialize all object variables  //
		//==================================//
		self->comment = PyString_FromString("");
		if (self->comment == NULL)
		{
			Py_DECREF(self);
			return NULL;
		}

		self->type = ZSP_VERSION_RESP;
		self->length = 0;
	}

	return (PyObject *)self;
}

static int
zsp_version_resp_init(zsp_version_resp *self, PyObject *args, PyObject *kwds)
{
	return 0;
}

static void
zsp_version_resp_dealloc(zsp_version_resp *self)
{
	Py_XDECREF(self->comment);
	self->ob_type->tp_free((PyObject*)self);
}


/*============================================================================*
 *                      G E T T E R S / S E T T E R S                         *
 *============================================================================*/
static PyObject *
zsp_version_resp_get_comment(zsp_version_resp *self, void *closure)
{
	Py_INCREF(self->comment);
	return self->comment;
}

static int
zsp_version_resp_set_comment(zsp_version_resp *self, PyObject *value, void *closure)
{
	if (value == NULL)
	{
		SET_ERROR("Cannot delete comment attribute");
		return -1;
	}

	if (!PyString_Check(value))
	{
		SET_ERROR("The comment attribute value must be a string");
		return -1;
	}

	Py_DECREF(self->comment);
	Py_INCREF(value);
	self->comment = value;

	return 0;
}

static PyObject *
zsp_version_resp_parse(zsp_version_resp *self, PyObject *args)
{
	unsigned char			*raw;
	ZSP_VERSION_RESP_PACKET	*version_resp;
	const int				version_resp_length = 0;
	char					buffer[128];
	int						comment_length;
	PyObject				*retval;

	if (!PyArg_ParseTuple(args, "s#", &raw, &version_resp_length))
		return NULL;

	version_resp = (ZSP_VERSION_RESP_PACKET *)raw;

	self->type		= version_resp->header.packet_type;
	self->length	= ntohs(version_resp->header.payload_length);

	/* check the length */
	if (version_resp_length < (self->length + sizeof(ZSP_HEADER)))
		return NULL;

	/* return code */
	self->return_code = ntohs(version_resp->return_code);

	/* comment string */
	comment_length = self->length - (VERSION_RESP_SIZE - HEADER_SIZE);

	if (comment_length <= 0)
	{
		/* no return string */
		self->comment = PyString_FromString(buffer);
	}
	else
	{
		comment_length = self->length - (sizeof(ZSP_VERSION_RESP_PACKET) - sizeof(ZSP_HEADER));
		memset(buffer, '\0', sizeof(buffer));
		memcpy(buffer, &raw[sizeof(ZSP_VERSION_RESP_PACKET)], comment_length);
		self->comment = PyString_FromString(buffer);
	}

	if ((self->length + sizeof(ZSP_HEADER)) == version_resp_length)
		return Py_BuildValue("s", "");
	else
		return Py_BuildValue("s#", &raw[sizeof(ZSP_VERSION_RESP_PACKET) + comment_length],
					version_resp_length - (sizeof(ZSP_VERSION_RESP_PACKET) + comment_length));

}

static PyObject *
zsp_version_resp_build(zsp_version_resp *self, PyObject *args)
{
	ZSP_VERSION_RESP_PACKET	*version_resp;
	unsigned short			payload_length;
	unsigned char			*raw;
	char					*comment;
	int						comment_length;
	PyObject				*retval;

	comment = PyString_AsString(self->comment);
	comment_length = PyString_Size(self->comment);
	raw = (unsigned char *)calloc(VERSION_RESP_SIZE + comment_length, 1);

	version_resp = (ZSP_VERSION_RESP_PACKET *)raw;

	payload_length = VERSION_RESP_SIZE - HEADER_SIZE + comment_length;

	version_resp->header.packet_type = ZSP_VERSION_RESP;
	version_resp->header.payload_length = htons(payload_length);
	version_resp->return_code = htons(self->return_code);

	if (comment_length > 0)
		memcpy(&raw[VERSION_RESP_SIZE], comment, comment_length);

	retval = Py_BuildValue("s#", raw, VERSION_RESP_SIZE + comment_length);

	free(raw);

	return retval;
}

static PyMethodDef zsp_version_resp_methods[] = {
	{"parse", (PyCFunction)zsp_version_resp_parse, METH_VARARGS,
		"Parses the incoming ZSP authorization packet"},
	{"build", (PyCFunction)zsp_version_resp_build, METH_VARARGS,
		"Builds the actual raw packet for transmission"},
	{NULL} /* Sentinel */
};
/*==============================*
 *      TYPE DATA MEMBERS		*
 *==============================*/
static PyMemberDef zsp_version_resp_members[] = {
	{"type", T_INT, offsetof(zsp_version_resp, type), 0,
		"payload type"},
	{"length", T_INT, offsetof(zsp_version_resp, length), 0,
		"payload length"},
	{"return_code", T_INT, offsetof(zsp_version_resp, return_code), 0,
		"Code returned to client"},
	{NULL} /* Sentinel */
};

static PyGetSetDef zsp_version_resp_getseters[] = {
	{"comment",
		(getter)zsp_version_resp_get_comment,
		(setter)zsp_version_resp_set_comment,
		"comment text",
		NULL},
	{NULL} /* Sentinel */
};


static PyTypeObject zsp_version_resp_type = {
	PyObject_HEAD_INIT(NULL)
	0,											/* ob_size */
	"zsp_packets.zsp_version_resp",				/* tp_name */
	sizeof(zsp_version_resp),						/* tp_basicsize */
	0,											/* tp_itemsize */
	(destructor)zsp_version_resp_dealloc,			/* tp_dealloc */
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
	"ZSP Version Response packet",				/* tp_doc */
	0,											/* tp_traverse */
	0,											/* tp_clear */
	0,											/* tp_richcompare */
	0,											/* tp_weaklistoffset */
	0,											/* tp_iter */
	0,											/* tp_iternext */
	zsp_version_resp_methods,					/* tp_methods */
	zsp_version_resp_members,					/* tp_members */
	zsp_version_resp_getseters,					/* tp_getset */
	0,											/* tp_base */
	0,											/* tp_dict */
	0,											/* tp_descr_get */
	0,											/* tp_descr_set */
	0,											/* tp_dictoffset */
	(initproc)zsp_version_resp_init,				/* tp_init */
	0,											/* tp_alloc */
	zsp_version_resp_new,							/* tp_new */
};

void initialize_zsp_version_resp(PyObject *m)
{
	if (PyType_Ready(&zsp_version_resp_type) < 0)
		return;

	Py_INCREF(&zsp_version_resp_type);
	PyModule_AddObject(m, "zsp_version_resp", (PyObject *)&zsp_version_resp_type);
}

