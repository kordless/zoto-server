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

#define SET_ERROR( msg ) { PyErr_SetString(PyExc_TypeError, msg ); }

typedef struct
{
	PyObject_HEAD
	int				type;
	unsigned short	length;
} zsp_header;

static PyObject *
zsp_header_new(PyTypeObject *type, PyObject *args, PyObject *kwds)
{
	zsp_header *self;

	self = (zsp_header *)type->tp_alloc(type, 0);
	if (self != NULL)
	{
		self->type = ZSP_NONE;
		self->length = 0;
	}

	return (PyObject *)self;
}

static int
zsp_header_init(zsp_header *self, PyObject *args, PyObject *kwds)
{
	return 0;
}

static void
zsp_header_dealloc(zsp_header *self)
{
	self->ob_type->tp_free((PyObject*)self);
}

static PyMemberDef zsp_header_members[] = {
	{"type", T_INT, offsetof(zsp_header, type), 0,
		"packet type"},
	{"length", T_INT, offsetof(zsp_header, length), 0,
		"packet length"},
	{NULL} /* Sentinel */
};

static PyGetSetDef zsp_header_getseters[] = {
	{NULL} /* Sentinel */
};

static PyObject *
zsp_header_parse(zsp_header *self, PyObject *args)
{
	char		*raw;
	ZSP_HEADER	*header;
	const int	header_length = 0;
	if (!PyArg_ParseTuple(args, "s#", &raw, &header_length))
		return NULL;

	header = (ZSP_HEADER *)raw;
	self->type = header->packet_type;
	self->length = ntohs(header->payload_length);

	self->length += sizeof(ZSP_HEADER);

	return Py_BuildValue("i", 1);
}

static PyMethodDef zsp_header_methods[] = {
	{"parse", (PyCFunction)zsp_header_parse, METH_VARARGS,
		"Parses the incoming ZSP header"
	},
	{NULL} /* Seninel */
};

static PyTypeObject zsp_header_type = {
	PyObject_HEAD_INIT(NULL)
	0,											/* ob_size */
	"zsp_packets.zsp_header",					/* tp_name */
	sizeof(zsp_header),							/* tp_basicsize */
	0,											/* tp_itemsize */
	(destructor)zsp_header_dealloc,				/* tp_dealloc */
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
	"auth packet",								/* tp_doc */
	0,											/* tp_traverse */
	0,											/* tp_clear */
	0,											/* tp_richcompare */
	0,											/* tp_weaklistoffset */
	0,											/* tp_iter */
	0,											/* tp_iternext */
	zsp_header_methods,							/* tp_methods */
	zsp_header_members,							/* tp_members */
	zsp_header_getseters,						/* tp_getset */
	0,											/* tp_base */
	0,											/* tp_dict */
	0,											/* tp_descr_get */
	0,											/* tp_descr_set */
	0,											/* tp_dictoffset */
	(initproc)zsp_header_init,					/* tp_init */
	0,											/* tp_alloc */
	zsp_header_new,								/* tp_new */
};

void initialize_zsp_header(PyObject *m)
{
	if (PyType_Ready(&zsp_header_type) < 0)
		return;

	Py_INCREF(&zsp_header_type);
	PyModule_AddObject(m, "zsp_header", (PyObject *)&zsp_header_type);
}

