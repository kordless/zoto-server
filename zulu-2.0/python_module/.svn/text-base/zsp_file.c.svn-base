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
} zsp_file;

/*============================================================================*
 *    C R E A T I O N / I N I T I A L I Z A T I O N / D E S T R U C T I O N   *
 *============================================================================*/
static PyObject *
zsp_file_new(PyTypeObject *type, PyObject *args, PyObject *kwds)
{
	zsp_file *self;

	self = (zsp_file *)type->tp_alloc(type, 0);
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
zsp_file_init(zsp_file *self, PyObject *args, PyObject *kwds)
{
	return 0;
}

static void
zsp_file_dealloc(zsp_file *self)
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
zsp_file_get_image_id(zsp_file *self, void *closure)
{
	Py_INCREF(self->image_id);
	return self->image_id;
}

static int
zsp_file_set_image_id(zsp_file *self, PyObject *value, void *closure)
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
zsp_file_get_image_date(zsp_file *self, void *closure)
{
	Py_INCREF(self->image_date);
	return self->image_date;
}

static int
zsp_file_set_image_date(zsp_file *self, PyObject *value, void *closure)
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
zsp_file_get_image_name(zsp_file *self, void *closure)
{
	Py_INCREF(self->image_name);
	return self->image_name;
}

static int
zsp_file_set_image_name(zsp_file *self, PyObject *value, void *closure)
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
zsp_file_parse(zsp_file *self, PyObject *args)
{
	unsigned char	*raw;
	ZSP_FILE_PACKET	*file;
	const int		file_length = 0;
	char			buffer[128];
	int				name_length;

	if (!PyArg_ParseTuple(args, "s#", &raw, &file_length))
		return NULL;

	file = (ZSP_FILE_PACKET *)raw;

	self->type		= file->header.packet_type;
	self->length	= ntohs(file->header.payload_length);

	/* check the length */
	if (file_length < (self->length + HEADER_SIZE))
		return NULL;

	self->image_size = ntohl(file->image_size);
	self->image_format = ntohl(file->image_format);

	/* image id */
	memset(buffer, '\0', sizeof(buffer));
	memcpy(buffer, file->image_id, sizeof(file->image_id));
	self->image_id = PyString_FromString(buffer);

	/* image date */
	memset(buffer, '\0', sizeof(buffer));
	memcpy(buffer, file->image_date, sizeof(file->image_date));
	self->image_date = PyString_FromString(buffer);

	/* image name */
	name_length = self->length - (FILE_SIZE - HEADER_SIZE);
	memset(buffer, '\0', sizeof(buffer));
	memcpy(buffer, &raw[FILE_SIZE], name_length);
	self->image_name = PyString_FromString(buffer);

	if ((self->length + HEADER_SIZE) == file_length)
		return Py_BuildValue("s", "");
	else
		return Py_BuildValue("s#", &raw[FILE_SIZE + name_length],
					file_length - FILE_SIZE + name_length);
}

static PyMethodDef zsp_file_methods[] = {
	{"parse", (PyCFunction)zsp_file_parse, METH_VARARGS,
		"Parses the incoming ZSP upload packet"
	},
	{NULL} /* Sentinel */
};
/*==============================*
 *      TYPE DATA MEMBERS		*
 *==============================*/
static PyMemberDef zsp_file_members[] = {
	{"type", T_INT, offsetof(zsp_file, type), 0,
		"payload type"},
	{"length", T_INT, offsetof(zsp_file, length), 0,
		"payload length"},
	{"image_format", T_INT, offsetof(zsp_file, image_format), 0,
		"image format"},
	{"image_size", T_ULONG, offsetof(zsp_file, image_size), 0,
		"image size"},
	{NULL} /* Sentinel */
};

static PyGetSetDef zsp_file_getseters[] = {
	{"image_id",
		(getter)zsp_file_get_image_id,
		(setter)zsp_file_set_image_id,
		"image id",
		NULL},
	{"image_date",
		(getter)zsp_file_get_image_date,
		(setter)zsp_file_set_image_date,
		"image date",
		NULL},
	{"image_name",
		(getter)zsp_file_get_image_name,
		(setter)zsp_file_set_image_name,
		"image name",
		NULL},
	{NULL} /* Sentinel */
};


static PyTypeObject zsp_file_type = {
	PyObject_HEAD_INIT(NULL)
	0,											/* ob_size */
	"zsp_packets.zsp_file",						/* tp_name */
	sizeof(zsp_file),							/* tp_basicsize */
	0,											/* tp_itemsize */
	(destructor)zsp_file_dealloc,				/* tp_dealloc */
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
	"ZSP Upload packet",						/* tp_doc */
	0,											/* tp_traverse */
	0,											/* tp_clear */
	0,											/* tp_richcompare */
	0,											/* tp_weaklistoffset */
	0,											/* tp_iter */
	0,											/* tp_iternext */
	zsp_file_methods,							/* tp_methods */
	zsp_file_members,							/* tp_members */
	zsp_file_getseters,							/* tp_getset */
	0,											/* tp_base */
	0,											/* tp_dict */
	0,											/* tp_descr_get */
	0,											/* tp_descr_set */
	0,											/* tp_dictoffset */
	(initproc)zsp_file_init,					/* tp_init */
	0,											/* tp_alloc */
	zsp_file_new,								/* tp_new */
};

void initialize_zsp_file(PyObject *m)
{
	if (PyType_Ready(&zsp_file_type) < 0)
		return;

	Py_INCREF(&zsp_file_type);
	PyModule_AddObject(m, "zsp_file", (PyObject *)&zsp_file_type);
}

