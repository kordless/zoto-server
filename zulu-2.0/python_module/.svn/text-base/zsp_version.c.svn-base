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
	unsigned short	vers_maj;
	unsigned short	vers_min;
	unsigned short	vers_build;
} zsp_version;

/*============================================================================*
 *    C R E A T I O N / I N I T I A L I Z A T I O N / D E S T R U C T I O N   *
 *============================================================================*/
static PyObject *
zsp_version_new(PyTypeObject *type, PyObject *args, PyObject *kwds)
{
	zsp_version *self;

	self = (zsp_version *)type->tp_alloc(type, 0);
	if (self != NULL)
	{
		self->type = ZSP_NONE;
		self->length = 0;
		self->vers_maj = 0;
		self->vers_min = 0;
		self->vers_build = 0;
	}

	return (PyObject *)self;
}

static int
zsp_version_init(zsp_version *self, PyObject *args, PyObject *kwds)
{
	return 0;
}

static void
zsp_version_dealloc(zsp_version *self)
{
	self->ob_type->tp_free((PyObject*)self);
}


static PyObject *
zsp_version_parse(zsp_version *self, PyObject *args)
{
	const char			*raw;
	ZSP_VERSION_PACKET	*version;
	const int			version_length = 0;

	if (!PyArg_ParseTuple(args, "s#", &raw, &version_length))
		return NULL;

	version			= (ZSP_VERSION_PACKET *)raw;

	self->type		= version->header.packet_type;
	self->length	= ntohs(version->header.payload_length);

	/* check the length */
	if (version_length < (self->length + HEADER_SIZE))
		return NULL;

	/* major version */
	self->vers_maj = ntohs(version->vers_maj);

	/* minor version */
	self->vers_min = ntohs(version->vers_min);

	/* build version */
	self->vers_build = ntohs(version->vers_build);

	if ((self->length + HEADER_SIZE) == version_length)
		return Py_BuildValue("s", "");
	else
		return Py_BuildValue("s#", &raw[VERSION_SIZE], version_length - VERSION_SIZE);
}

static PyObject *
zsp_version_build(zsp_version *self, PyObject *args)
{
	ZSP_VERSION_PACKET		*version;
	unsigned short			payload_length;
	unsigned char			*raw;
	PyObject				*retval;

	raw = (unsigned char *)calloc(VERSION_SIZE, 1);

	version = (ZSP_VERSION_PACKET *)raw;

	payload_length = VERSION_SIZE - HEADER_SIZE;

	version->header.packet_type = ZSP_VERSION;
	version->header.payload_length = htons(payload_length);
	version->vers_maj = htons(self->vers_maj);
	version->vers_min = htons(self->vers_min);
	version->vers_build = htons(self->vers_build);

	retval = Py_BuildValue("s#", raw, VERSION_SIZE);

	free(raw);

	return retval;
}

static PyMethodDef zsp_version_methods[] = {
	{"parse", (PyCFunction)zsp_version_parse, METH_VARARGS,
		"Parses the incoming ZSP version packet"
	},
	{"build", (PyCFunction)zsp_version_build, METH_VARARGS,
		"Builds the raw packet for transmission"
	},
	{NULL} /* Sentinel */
};
/*==============================*
 *      TYPE DATA MEMBERS		*
 *==============================*/
static PyMemberDef zsp_version_members[] = {
	{"type", T_INT, offsetof(zsp_version, type), 0,
		"payload type"},
	{"length", T_INT, offsetof(zsp_version, length), 0,
		"payload length"},
	{"vers_maj", T_USHORT, offsetof(zsp_version, vers_maj), 0,
		"major version"},
	{"vers_min", T_USHORT, offsetof(zsp_version, vers_min), 0,
		"minor version"},
	{"vers_build", T_USHORT, offsetof(zsp_version, vers_build), 0,
		"build version"},
	{NULL} /* Sentinel */
};

static PyGetSetDef zsp_version_getseters[] = {
	{NULL} /* Sentinel */
};


static PyTypeObject zsp_version_type = {
	PyObject_HEAD_INIT(NULL)
	0,											/* ob_size */
	"zsp_packets.zsp_version",					/* tp_name */
	sizeof(zsp_version),						/* tp_basicsize */
	0,											/* tp_itemsize */
	(destructor)zsp_version_dealloc,			/* tp_dealloc */
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
	"ZSP Version packet",						/* tp_doc */
	0,											/* tp_traverse */
	0,											/* tp_clear */
	0,											/* tp_richcompare */
	0,											/* tp_weaklistoffset */
	0,											/* tp_iter */
	0,											/* tp_iternext */
	zsp_version_methods,						/* tp_methods */
	zsp_version_members,						/* tp_members */
	zsp_version_getseters,						/* tp_getset */
	0,											/* tp_base */
	0,											/* tp_dict */
	0,											/* tp_descr_get */
	0,											/* tp_descr_set */
	0,											/* tp_dictoffset */
	(initproc)zsp_version_init,					/* tp_init */
	0,											/* tp_alloc */
	zsp_version_new,							/* tp_new */
};

void initialize_zsp_version(PyObject *m)
{
	if (PyType_Ready(&zsp_version_type) < 0)
		return;

	Py_INCREF(&zsp_version_type);
	PyModule_AddObject(m, "zsp_version", (PyObject *)&zsp_version_type);
}

