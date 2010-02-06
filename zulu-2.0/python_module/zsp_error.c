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
	unsigned short	error_code;
	PyObject		*error_string;
} zsp_error;

/*============================================================================*
 *    C R E A T I O N / I N I T I A L I Z A T I O N / D E S T R U C T I O N   *
 *============================================================================*/
static PyObject *
zsp_error_new(PyTypeObject *type, PyObject *args, PyObject *kwds)
{
	zsp_error *self;

	self = (zsp_error *)type->tp_alloc(type, 0);
	if (self != NULL)
	{
		//==================================//
		// Initialize all object variables  //
		//==================================//
		self->error_string = PyString_FromString("");
		if (self->error_string == NULL)
		{
			Py_DECREF(self);
			return NULL;
		}

		self->type = ZSP_NONE;
		self->length = 0;
		self->error_code = 0;
	}

	return (PyObject *)self;
}

static int
zsp_error_init(zsp_error *self, PyObject *args, PyObject *kwds)
{
	return 0;
}

static void
zsp_error_dealloc(zsp_error *self)
{
	Py_XDECREF(self->error_string);
	self->ob_type->tp_free((PyObject*)self);
}


/*============================================================================*
 *                      G E T T E R S / S E T T E R S                         *
 *============================================================================*/
static PyObject *
zsp_error_get_error_string(zsp_error *self, void *closure)
{
	Py_INCREF(self->error_string);
	return self->error_string;
}

static int
zsp_error_set_error_string(zsp_error *self, PyObject *value, void *closure)
{
	if (value == NULL)
	{
		SET_ERROR("Cannot delete error_string attribute");
		return -1;
	}

	if (!PyString_Check(value))
	{
		SET_ERROR("The error_string attribute value must be a string");
		return -1;
	}

	Py_DECREF(self->error_string);
	Py_INCREF(value);
	self->error_string = value;

	return 0;
}

static PyObject *
zsp_error_parse(zsp_error *self, PyObject *args)
{
	unsigned char			*raw;
	ZSP_ERROR_PACKET		*error_packet;
	int						error_packet_length = 0;
	char					buffer[128];
	int						error_string_length;

	if (!PyArg_ParseTuple(args, "s#", &raw, &error_packet_length))
		return NULL;

	error_packet = (ZSP_ERROR_PACKET *)raw;

	self->type		= error_packet->header.packet_type;
	self->length	= ntohs(error_packet->header.payload_length);

	/* check the length */
	if (error_packet_length < (self->length + HEADER_SIZE))
		return NULL;

	/* return_code */
	self->error_code = ntohs(error_packet->error_code);

	/* response string */
	memset(buffer, '\0', sizeof(buffer));
	memcpy(buffer, &raw[ERROR_SIZE],
			error_packet_length - ERROR_SIZE);
	self->error_string = PyString_FromString(buffer);

	return Py_BuildValue("i", 1);
}

static PyObject *
zsp_error_build(zsp_error *self, PyObject *args)
{
	ZSP_ERROR_PACKET		*error_packet;
	unsigned short			payload_length;
	unsigned char			*raw;
	char					*error_string;
	int						error_string_length;
	PyObject				*retval;

	error_string = PyString_AsString(self->error_string);
	error_string_length = PyString_Size(self->error_string);
	raw = (unsigned char *)calloc(ERROR_SIZE + error_string_length, 1);

	error_packet = (ZSP_ERROR_PACKET *)raw;

	payload_length = ERROR_SIZE - HEADER_SIZE + error_string_length;

	error_packet->header.packet_type = ZSP_ERROR;
	error_packet->header.payload_length = htons(payload_length);
	error_packet->error_code = htons(self->error_code);

	memcpy(&raw[ERROR_SIZE], error_string, error_string_length);

	retval = Py_BuildValue("s#", raw, ERROR_SIZE + error_string_length);

	free(raw);

	return retval;
}

static PyMethodDef zsp_error_methods[] = {
	{"parse", (PyCFunction)zsp_error_parse, METH_VARARGS,
		"Parses the incoming ZSP Error packet"},
	{"build", (PyCFunction)zsp_error_build, METH_VARARGS,
		"Builds the actual raw packet for transmission"},
	{NULL} /* Sentinel */
};
/*==============================*
 *      TYPE DATA MEMBERS		*
 *==============================*/
static PyMemberDef zsp_error_members[] = {
	{"type", T_INT, offsetof(zsp_error, type), 0,
		"payload type"},
	{"length", T_INT, offsetof(zsp_error, length), 0,
		"payload length"},
	{"error_code", T_USHORT, offsetof(zsp_error, error_code), 0,
		"error code"},
	{NULL} /* Sentinel */
};

static PyGetSetDef zsp_error_getseters[] = {
	{"error_string",
		(getter)zsp_error_get_error_string,
		(setter)zsp_error_set_error_string,
		"error text",
		NULL},
	{NULL} /* Sentinel */
};


static PyTypeObject zsp_error_type = {
	PyObject_HEAD_INIT(NULL)
	0,											/* ob_size */
	"zsp_packets.zsp_error",				/* tp_name */
	sizeof(zsp_error),						/* tp_basicsize */
	0,											/* tp_itemsize */
	(destructor)zsp_error_dealloc,			/* tp_dealloc */
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
	zsp_error_methods,						/* tp_methods */
	zsp_error_members,						/* tp_members */
	zsp_error_getseters,					/* tp_getset */
	0,											/* tp_base */
	0,											/* tp_dict */
	0,											/* tp_descr_get */
	0,											/* tp_descr_set */
	0,											/* tp_dictoffset */
	(initproc)zsp_error_init,				/* tp_init */
	0,											/* tp_alloc */
	zsp_error_new,							/* tp_new */
};

void initialize_zsp_error(PyObject *m)
{
	if (PyType_Ready(&zsp_error_type) < 0)
		return;

	Py_INCREF(&zsp_error_type);
	PyModule_AddObject(m, "zsp_error", (PyObject *)&zsp_error_type);
}
