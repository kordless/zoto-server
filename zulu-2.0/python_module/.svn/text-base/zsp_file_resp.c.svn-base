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
	unsigned short	return_code;
	PyObject		*return_string;
} zsp_file_resp;

/*============================================================================*
 *    C R E A T I O N / I N I T I A L I Z A T I O N / D E S T R U C T I O N   *
 *============================================================================*/
static PyObject *
zsp_file_resp_new(PyTypeObject *type, PyObject *args, PyObject *kwds)
{
	zsp_file_resp *self;

	self = (zsp_file_resp *)type->tp_alloc(type, 0);
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

		self->return_string = PyString_FromString("");
		if (self->return_string == NULL)
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
zsp_file_resp_init(zsp_file_resp *self, PyObject *args, PyObject *kwds)
{
	return 0;
}

static void
zsp_file_resp_dealloc(zsp_file_resp *self)
{
	Py_XDECREF(self->return_string);
	self->ob_type->tp_free((PyObject*)self);
}


/*============================================================================*
 *                      G E T T E R S / S E T T E R S                         *
 *============================================================================*/
static PyObject *
zsp_file_resp_get_image_id(zsp_file_resp *self, void *closure)
{
	Py_INCREF(self->image_id);
	return self->image_id;
}

static int
zsp_file_resp_set_image_id(zsp_file_resp *self, PyObject *value, void *closure)
{
	if (value == NULL)
	{
		SET_ERROR("Cannot delete iamge_id attribute");
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
zsp_file_resp_get_return_string(zsp_file_resp *self, void *closure)
{
	Py_INCREF(self->return_string);
	return self->return_string;
}

static int
zsp_file_resp_set_return_string(zsp_file_resp *self, PyObject *value, void *closure)
{
	if (value == NULL)
	{
		SET_ERROR("Cannot delete return_string attribute");
		return -1;
	}

	if (!PyString_Check(value))
	{
		SET_ERROR("The return_string attribute value must be a string");
		return -1;
	}

	Py_DECREF(self->return_string);
	Py_INCREF(value);
	self->return_string = value;

	return 0;
}

static PyObject *
zsp_file_resp_parse(zsp_file_resp *self, PyObject *args)
{
	unsigned char			*raw;
	ZSP_FILE_RESP_PACKET	*file_resp;
	int						file_resp_length = 0;
	char					buffer[128];
	int						return_string_length;

	if (!PyArg_ParseTuple(args, "s#", &raw, &file_resp_length))
		return NULL;

	file_resp = (ZSP_FILE_RESP_PACKET *)raw;

	self->type		= file_resp->header.packet_type;
	self->length	= ntohs(file_resp->header.payload_length);

	/* check the length */
	if (file_resp_length < (self->length + HEADER_SIZE))
		return NULL;

	/* return code */
	self->return_code = ntohs(file_resp->return_code);

	/* image_id */
	memset(buffer, '\0', sizeof(buffer));
	memcpy(buffer, file_resp->image_id, sizeof(file_resp->image_id));
	self->image_id = PyString_FromString(buffer);

	/* return string */
	memset(buffer, '\0', sizeof(buffer));
	memcpy(buffer, &raw[FILE_RESP_SIZE], self->length - (FILE_RESP_SIZE - HEADER_SIZE));
	self->return_string = PyString_FromString(buffer);

	return Py_BuildValue("i", 1);
}

static PyObject *
zsp_file_resp_build(zsp_file_resp *self, PyObject *args)
{
	ZSP_FILE_RESP_PACKET	*file_resp;
	unsigned short			payload_length;
	unsigned char			*raw;
	PyObject				*retval;
	const char*				return_string;
	int						return_string_length;
	const char*				image_id;

	image_id = PyString_AsString(self->image_id);
	return_string = PyString_AsString(self->return_string);
	return_string_length = PyString_Size(self->return_string);
	raw = (unsigned char *)calloc(FILE_RESP_SIZE + return_string_length, 1);
	file_resp = (ZSP_FILE_RESP_PACKET *)raw;

	payload_length = FILE_RESP_SIZE - HEADER_SIZE + return_string_length;

	file_resp->header.packet_type = ZSP_FILE_RESP;
	file_resp->header.payload_length = htons(payload_length);
	memcpy(file_resp->image_id, image_id, sizeof(file_resp->image_id));
	file_resp->return_code = htons(self->return_code);
	memcpy(&raw[FILE_RESP_SIZE], return_string, return_string_length);

	retval = Py_BuildValue("s#", raw, FILE_RESP_SIZE + return_string_length);

	free(raw);

	return retval;
}

static PyMethodDef zsp_file_resp_methods[] = {
	{"parse", (PyCFunction)zsp_file_resp_parse, METH_VARARGS,
		"Parses the incoming ZSP Upload Response packet"},
	{"build", (PyCFunction)zsp_file_resp_build, METH_VARARGS,
		"Builds the actual raw packet for transmission"},
	{NULL} /* Sentinel */
};
/*==============================*
 *      TYPE DATA MEMBERS		*
 *==============================*/
static PyMemberDef zsp_file_resp_members[] = {
	{"type", T_INT, offsetof(zsp_file_resp, type), 0,
		"payload type"},
	{"length", T_INT, offsetof(zsp_file_resp, length), 0,
		"payload length"},
	{"return_code", T_USHORT, offsetof(zsp_file_resp, return_code), 0,
		"return code"},
	{NULL} /* Sentinel */
};

static PyGetSetDef zsp_file_resp_getseters[] = {
	{"image_id",
		(getter)zsp_file_resp_get_image_id,
		(setter)zsp_file_resp_set_image_id,
		"image id",
		NULL},
	{"return_string",
		(getter)zsp_file_resp_get_return_string,
		(setter)zsp_file_resp_set_return_string,
		"return string",
		NULL},
	{NULL} /* Sentinel */
};


static PyTypeObject zsp_file_resp_type = {
	PyObject_HEAD_INIT(NULL)
	0,											/* ob_size */
	"zsp_packets.zsp_file_resp",				/* tp_name */
	sizeof(zsp_file_resp),						/* tp_basicsize */
	0,											/* tp_itemsize */
	(destructor)zsp_file_resp_dealloc,			/* tp_dealloc */
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
	"ZSP Upload Response packet",				/* tp_doc */
	0,											/* tp_traverse */
	0,											/* tp_clear */
	0,											/* tp_richcompare */
	0,											/* tp_weaklistoffset */
	0,											/* tp_iter */
	0,											/* tp_iternext */
	zsp_file_resp_methods,						/* tp_methods */
	zsp_file_resp_members,						/* tp_members */
	zsp_file_resp_getseters,					/* tp_getset */
	0,											/* tp_base */
	0,											/* tp_dict */
	0,											/* tp_descr_get */
	0,											/* tp_descr_set */
	0,											/* tp_dictoffset */
	(initproc)zsp_file_resp_init,				/* tp_init */
	0,											/* tp_alloc */
	zsp_file_resp_new,							/* tp_new */
};

void initialize_zsp_file_resp(PyObject *m)
{
	if (PyType_Ready(&zsp_file_resp_type) < 0)
		return;

	Py_INCREF(&zsp_file_resp_type);
	PyModule_AddObject(m, "zsp_file_resp", (PyObject *)&zsp_file_resp_type);
}

