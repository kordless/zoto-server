/*============================================================================*
 *                                                                            *
 *	This done is part of the Zoto Software suite.  							  *
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
static char gBuffer[1024];

/*============================================================================*
 *                      O B J E C T   D A T A   M E M B E R S				  *
 *============================================================================*/
typedef struct
{
	PyObject_HEAD
	int				type;
	unsigned short	length;
	PyObject		*image_id;
} zsp_done;

/*============================================================================*
 *    C R E A T I O N / I N I T I A L I Z A T I O N / D E S T R U C T I O N   *
 *============================================================================*/
static PyObject *
zsp_done_new(PyTypeObject *type, PyObject *args, PyObject *kwds)
{
	zsp_done *self;

	self = (zsp_done *)type->tp_alloc(type, 0);
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

		self->type = ZSP_NONE;
		self->length = 0;
	}

	return (PyObject *)self;
}

static int
zsp_done_init(zsp_done *self, PyObject *args, PyObject *kwds)
{
	return 0;
}

static void
zsp_done_dealloc(zsp_done *self)
{
	Py_XDECREF(self->image_id);
	self->ob_type->tp_free((PyObject*)self);
}


/*============================================================================*
 *                      G E T T E R S / S E T T E R S                         *
 *============================================================================*/

/*
 * image_id
 */
static PyObject *
zsp_done_get_image_id(zsp_done *self, void *closure)
{
	Py_INCREF(self->image_id);
	return self->image_id;
}

static int
zsp_done_set_image_id(zsp_done *self, PyObject *value, void *closure)
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

static PyObject *
zsp_done_parse(zsp_done *self, PyObject *args)
{
	unsigned char	*raw;
	ZSP_DONE_PACKET	*done;
	const int		done_length = 0;
	char			buffer[128];
	int				name_length;

	if (!PyArg_ParseTuple(args, "s#", &raw, &done_length))
	{
		strcpy(gBuffer, "ZSP_MODULE: Unable to parse arguments");
		printf(gBuffer);
		SET_ERROR(gBuffer);
		return NULL;
	}

	done = (ZSP_DONE_PACKET *)raw;

	self->type		= done->header.packet_type;
	self->length	= ntohs(done->header.payload_length);

	/* check the length */
	if (done_length < (self->length + HEADER_SIZE))
	{
		sprintf(gBuffer, "ZSP_MODULE: Length not correct - got %d, expected %d",
					done_length, self->length + HEADER_SIZE);
		SET_ERROR(gBuffer);
		printf(gBuffer);
		return NULL;
	}

	/* image id */
	memset(buffer, '\0', sizeof(buffer));
	memcpy(buffer, done->image_id, sizeof(done->image_id));
	self->image_id = PyString_FromString(buffer);

	if ((self->length + HEADER_SIZE) == done_length)
		return Py_BuildValue("s", "");
	else
		return Py_BuildValue("s#", &raw[DONE_SIZE],
					done_length - DONE_SIZE);
}

static PyMethodDef zsp_done_methods[] = {
	{"parse", (PyCFunction)zsp_done_parse, METH_VARARGS,
		"Parses the incoming ZSP upload packet"
	},
/*	{"build", (PyCFunction)zsp_done_parse, METH_VARARDS,
		"Builds the outgoing packet"
	},*/
	{NULL} /* Sentinel */
};
/*==============================*
 *      TYPE DATA MEMBERS		*
 *==============================*/
static PyMemberDef zsp_done_members[] = {
	{"type", T_INT, offsetof(zsp_done, type), 0,
		"payload type"},
	{"length", T_INT, offsetof(zsp_done, length), 0,
		"payload length"},
	{NULL} /* Sentinel */
};

static PyGetSetDef zsp_done_getseters[] = {
	{"image_id",
		(getter)zsp_done_get_image_id,
		(setter)zsp_done_set_image_id,
		"image id",
		NULL},
	{NULL} /* Sentinel */
};


static PyTypeObject zsp_done_type = {
	PyObject_HEAD_INIT(NULL)
	0,											/* ob_size */
	"zsp_packets.zsp_done",						/* tp_name */
	sizeof(zsp_done),							/* tp_basicsize */
	0,											/* tp_itemsize */
	(destructor)zsp_done_dealloc,				/* tp_dealloc */
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
	zsp_done_methods,							/* tp_methods */
	zsp_done_members,							/* tp_members */
	zsp_done_getseters,							/* tp_getset */
	0,											/* tp_base */
	0,											/* tp_dict */
	0,											/* tp_descr_get */
	0,											/* tp_descr_set */
	0,											/* tp_dictoffset */
	(initproc)zsp_done_init,					/* tp_init */
	0,											/* tp_alloc */
	zsp_done_new,								/* tp_new */
};

void initialize_zsp_done(PyObject *m)
{
	if (PyType_Ready(&zsp_done_type) < 0)
		return;

	Py_INCREF(&zsp_done_type);
	PyModule_AddObject(m, "zsp_done", (PyObject *)&zsp_done_type);
}

