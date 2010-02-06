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
	PyObject		*image_id;
	int				image_format;
	ulong			image_size;
	PyObject		*image_date;
	PyObject		*image_name;
} zsp_flag;

/*============================================================================*
 *    C R E A T I O N / I N I T I A L I Z A T I O N / D E S T R U C T I O N   *
 *============================================================================*/
static PyObject *
zsp_flag_new(PyTypeObject *type, PyObject *args, PyObject *kwds)
{
	zsp_flag *self;

	self = (zsp_flag *)type->tp_alloc(type, 0);
	if (self != NULL)
	{
		//==================================//
		// Initialize all object variables  //
		//==================================//
		self->image_id = PyString_FromString("");
		if (self->image_id == NULL)
		{
			Py_DECREF(self);
			return NULL;
		}

		self->image_date = PyString_FromString("");
		if (self->image_date == NULL)
		{
			Py_DECREF(self);
			return NULL;
		}

		self->image_name = PyString_FromString("");
		if (self->image_name == NULL)
		{
			Py_DECREF(self);
			return NULL;
		}

		self->type = ZSP_NONE;
		self->length = 0;
		self->image_format = ZSP_NONE;
		self->image_size = 0L;
	}

	return (PyObject *)self;
}

static int
zsp_flag_init(zsp_flag *self, PyObject *args, PyObject *kwds)
{
	return 0;
}

static void
zsp_flag_dealloc(zsp_flag *self)
{
	Py_XDECREF(self->image_id);
	Py_XDECREF(self->image_date);
	Py_XDECREF(self->image_name);
	self->ob_type->tp_free((PyObject*)self);
}


/*============================================================================*
 *                      G E T T E R S / S E T T E R S                         *
 *============================================================================*/

/*
 * image_id
 */
static PyObject *
zsp_flag_get_image_id(zsp_flag *self, void *closure)
{
	Py_INCREF(self->image_id);
	return self->image_id;
}

static int
zsp_flag_set_image_id(zsp_flag *self, PyObject *value, void *closure)
{
	if (value == NULL)
	{
		SET_ERROR("Cannot delete image_id attribute");
		return -1;
	}

	if (!PyString_Check(value))
	{
		SET_ERROR("The image_id attribute value must be a string");
		return -1;
	}

	Py_DECREF(self->image_id);
	Py_INCREF(value);
	self->image_id = value;

	return 0;
}

/*
 * image_date
 */
static PyObject *
zsp_flag_get_image_date(zsp_flag *self, void *closure)
{
	Py_INCREF(self->image_date);
	return self->image_date;
}

static int
zsp_flag_set_image_date(zsp_flag *self, PyObject *value, void *closure)
{
	if (value == NULL)
	{
		SET_ERROR("Cannot delete image_date attribute");
		return -1;
	}

	if (!PyString_Check(value))
	{
		SET_ERROR("The image_date attribute value must be a string");
		return -1;
	}

	Py_DECREF(self->image_date);
	Py_INCREF(value);
	self->image_date = value;

	return 0;
}

/*
 * image_name
 */
static PyObject *
zsp_flag_get_image_name(zsp_flag *self, void *closure)
{
	Py_INCREF(self->image_name);
	return self->image_name;
}

static int
zsp_flag_set_image_name(zsp_flag *self, PyObject *value, void *closure)
{
	if (value == NULL)
	{
		SET_ERROR("Cannot delete image_name attribute");
		return -1;
	}

	if (!PyString_Check(value))
	{
		SET_ERROR("The image_name attribute value must be a string");
		return -1;
	}

	Py_DECREF(self->image_name);
	Py_INCREF(value);
	self->image_name = value;

	return 0;
}

static PyObject *
zsp_flag_parse(zsp_flag *self, PyObject *args)
{
	unsigned char	*raw;
	ZSP_FLAG_PACKET	*flag;
	const int		flag_length = 0;
	char			buffer[128];
	int				name_length;

	if (!PyArg_ParseTuple(args, "s#", &raw, &flag_length))
		return NULL;

	flag = (ZSP_FLAG_PACKET *)raw;

	self->type		= flag->header.packet_type;
	self->length	= ntohs(flag->header.payload_length);

	/* check the length */
	if (flag_length < (self->length + HEADER_SIZE))
		return NULL;

	/* image id */
	memset(buffer, '\0', sizeof(buffer));
	memcpy(buffer, flag->image_id, sizeof(flag->image_id));
	self->image_id = PyString_FromString(buffer);

	/* image date */
	memset(buffer, '\0', sizeof(buffer));
	memcpy(buffer, flag->image_date, sizeof(flag->image_date));
	self->image_date = PyString_FromString(buffer);

	/* image name */
	name_length = self->length - (FLAG_SIZE - HEADER_SIZE);
	memset(buffer, '\0', sizeof(buffer));
	memcpy(buffer, &raw[FLAG_SIZE], name_length);
	self->image_name = PyString_FromString(buffer);

	/* image size */
	self->image_size = ntohl(flag->image_size);

	/* image_format */
	self->image_format = ntohl(flag->image_format);

	if ((self->length + HEADER_SIZE) == flag_length)
		return Py_BuildValue("s", "");
	else
		return Py_BuildValue("s#", &raw[FLAG_SIZE + name_length],
					flag_length - FLAG_SIZE + name_length);
}

static PyMethodDef zsp_flag_methods[] = {
	{"parse", (PyCFunction)zsp_flag_parse, METH_VARARGS,
		"Parses the incoming ZSP synchronization packet"
	},
	{NULL} /* Sentinel */
};
/*==============================*
 *      TYPE DATA MEMBERS		*
 *==============================*/
static PyMemberDef zsp_flag_members[] = {
	{"type", T_INT, offsetof(zsp_flag, type), 0,
		"payload type"},
	{"length", T_INT, offsetof(zsp_flag, length), 0,
		"payload length"},
	{"image_format", T_INT, offsetof(zsp_flag, image_format), 0,
		"image format"},
	{"image_size", T_ULONG, offsetof(zsp_flag, image_size), 0,
		"image size"},
	{NULL} /* Sentinel */
};

static PyGetSetDef zsp_flag_getseters[] = {
	{"image_id",
		(getter)zsp_flag_get_image_id,
		(setter)zsp_flag_set_image_id,
		"image id",
		NULL},
	{"image_date",
		(getter)zsp_flag_get_image_date,
		(setter)zsp_flag_set_image_date,
		"image date",
		NULL},
	{"image_name",
		(getter)zsp_flag_get_image_name,
		(setter)zsp_flag_set_image_name,
		"image name",
		NULL},
	{NULL} /* Sentinel */
};


static PyTypeObject zsp_flag_type = {
	PyObject_HEAD_INIT(NULL)
	0,											/* ob_size */
	"zsp_packets.zsp_flag",						/* tp_name */
	sizeof(zsp_flag),							/* tp_basicsize */
	0,											/* tp_itemsize */
	(destructor)zsp_flag_dealloc,				/* tp_dealloc */
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
	"ZSP Synchronization packet",				/* tp_doc */
	0,											/* tp_traverse */
	0,											/* tp_clear */
	0,											/* tp_richcompare */
	0,											/* tp_weaklistoffset */
	0,											/* tp_iter */
	0,											/* tp_iternext */
	zsp_flag_methods,							/* tp_methods */
	zsp_flag_members,							/* tp_members */
	zsp_flag_getseters,							/* tp_getset */
	0,											/* tp_base */
	0,											/* tp_dict */
	0,											/* tp_descr_get */
	0,											/* tp_descr_set */
	0,											/* tp_dictoffset */
	(initproc)zsp_flag_init,					/* tp_init */
	0,											/* tp_alloc */
	zsp_flag_new,								/* tp_new */
};

void initialize_zsp_flag(PyObject *m)
{
	if (PyType_Ready(&zsp_flag_type) < 0)
		return;

	Py_INCREF(&zsp_flag_type);
	PyModule_AddObject(m, "zsp_flag", (PyObject *)&zsp_flag_type);
}

