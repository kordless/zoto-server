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
	PyObject		*user_hash;
	PyObject		*pswd_hash;
	PyObject		*user_name;
} zsp_auth;

/*============================================================================*
 *    C R E A T I O N / I N I T I A L I Z A T I O N / D E S T R U C T I O N   *
 *============================================================================*/
static PyObject *
zsp_auth_new(PyTypeObject *type, PyObject *args, PyObject *kwds)
{
	zsp_auth *self;

	self = (zsp_auth *)type->tp_alloc(type, 0);
	if (self != NULL)
	{
		//==================================//
		// Initialize all object variables  //
		//==================================//
		self->user_hash = PyString_FromString("");
		if (self->user_hash == NULL)
		{
			Py_DECREF(self);
			return NULL;
		}

		self->pswd_hash = PyString_FromString("");
		if (self->pswd_hash == NULL)
		{
			Py_DECREF(self);
			return NULL;
		}

		self->user_name = PyString_FromString("");
		if (self->user_name == NULL)
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
zsp_auth_init(zsp_auth *self, PyObject *args, PyObject *kwds)
{
	return 0;
}

static void
zsp_auth_dealloc(zsp_auth *self)
{
	Py_XDECREF(self->user_hash);
	Py_XDECREF(self->pswd_hash);
	Py_XDECREF(self->user_name);
	self->ob_type->tp_free((PyObject*)self);
}


/*============================================================================*
 *                      G E T T E R S / S E T T E R S                         *
 *============================================================================*/

/*
 * user_hash
 */
static PyObject *
zsp_auth_get_user_hash(zsp_auth *self, void *closure)
{
	Py_INCREF(self->user_hash);
	return self->user_hash;
}

static int
zsp_auth_set_user_hash(zsp_auth *self, PyObject *value, void *closure)
{
	if (value == NULL)
	{
		SET_ERROR("Cannot delete user_hash attribute");
		return -1;
	}

	if (!PyString_Check(value))
	{
		SET_ERROR("The user_hash attribute value must be a string");
		return -1;
	}

	Py_DECREF(self->user_hash);
	Py_INCREF(value);
	self->user_hash = value;

	return 0;
}

/*
 * pswd_hash
 */
static PyObject *
zsp_auth_get_pswd_hash(zsp_auth *self, void *closure)
{
	Py_INCREF(self->pswd_hash);
	return self->pswd_hash;
}

static int
zsp_auth_set_pswd_hash(zsp_auth *self, PyObject *value, void *closure)
{
	if (value == NULL)
	{
		SET_ERROR("Cannot delete pswd_hash attribute");
		return -1;
	}

	if (!PyString_Check(value))
	{
		SET_ERROR("The pswd_hash attribute value must be a string");
		return -1;
	}

	Py_DECREF(self->pswd_hash);
	Py_INCREF(value);
	self->pswd_hash = value;

	return 0;
}

/*
 * user_name
 */
static PyObject *
zsp_auth_get_user_name(zsp_auth *self, void *closure)
{
	Py_INCREF(self->user_name);
	return self->user_name;
}

static int
zsp_auth_set_user_name(zsp_auth *self, PyObject *value, void *closure)
{
	if (value == NULL)
	{
		SET_ERROR("Cannot delete user_name attribute");
		return -1;
	}

	if (!PyString_Check(value))
	{
		SET_ERROR("The user_name attribute value must be a string");
		return -1;
	}

	Py_DECREF(self->user_name);
	Py_INCREF(value);
	self->user_name = value;

	return 0;
}

/*============================================================================*
 *                      M E M B E R   F U N C T I O N S                       *
 *============================================================================*/
static PyObject *
zsp_auth_parse(zsp_auth *self, PyObject *args)
{
	unsigned char	*raw;
	ZSP_AUTH_PACKET	*auth;
	const int		auth_length = 0;
	char			buffer[128];
	int				user_length;

	if (!PyArg_ParseTuple(args, "s#", &raw, &auth_length))
	{
		SET_ERROR("Unable to parse arguments");
		return NULL;
	}

	auth = (ZSP_AUTH_PACKET *)raw;

	self->type		= auth->header.packet_type;
	self->length	= ntohs(auth->header.payload_length);

	/* check the length */
	if (auth_length < (self->length + HEADER_SIZE))
	{
		SET_ERROR("Invalid length");
		return NULL;
	}

	/* user_hash */
	memset(buffer, '\0', sizeof(buffer));
	memcpy(buffer, auth->user_hash, sizeof(auth->user_hash));
	self->user_hash = PyString_FromString(buffer);

	/* pswd_hash */
	memset(buffer, '\0', sizeof(buffer));
	memcpy(buffer, auth->pswd_hash, sizeof(auth->pswd_hash));
	self->pswd_hash = PyString_FromString(buffer);

	/* user name */
	user_length = self->length - (AUTH_SIZE - HEADER_SIZE);
	memset(buffer, '\0', sizeof(buffer));
	memcpy(buffer, &raw[AUTH_SIZE], user_length);
	self->user_name = PyString_FromString(buffer);

	if ((self->length + HEADER_SIZE) == auth_length)
		return Py_BuildValue("s", "");
	else
		return Py_BuildValue("s#", &raw[AUTH_SIZE + user_length],
					auth_length - AUTH_SIZE + user_length);
}


static PyObject *
zsp_auth_build(zsp_auth *self, PyObject *args)
{
	ZSP_AUTH_PACKET	*auth;
	unsigned short	payload_length;
	unsigned char	*raw;
	char			*user_name;
	int				user_name_length;
	PyObject		*retval;

	user_name = PyString_AsString(self->user_name);
	user_name_length = PyString_Size(self->user_name);
	raw = (unsigned char *)calloc(AUTH_SIZE + user_name_length, 1);

	auth = (ZSP_AUTH_PACKET *)raw;

	payload_length = AUTH_SIZE - HEADER_SIZE + user_name_length;

	auth->header.packet_type = ZSP_AUTH;
	auth->header.payload_length = htons(payload_length);
	memcpy(auth->user_hash, PyString_AsString(self->user_hash), sizeof(auth->user_hash));
	memcpy(auth->pswd_hash, PyString_AsString(self->pswd_hash), sizeof(auth->pswd_hash));

	memcpy(&raw[AUTH_SIZE], user_name, user_name_length);

	retval = Py_BuildValue("s#", raw, AUTH_SIZE + user_name_length);

	free(raw);

	return retval;
}

/*==============================*
 *  TYPE DEFINITION STRUCTURES	*
 *==============================*/
static PyMemberDef zsp_auth_members[] = {
	{"type", T_INT, offsetof(zsp_auth, type), 0,
		"payload type"},
	{"length", T_INT, offsetof(zsp_auth, length), 0,
		"payload length"},
	{NULL} /* Sentinel */
};

static PyMethodDef zsp_auth_methods[] = {
	{"parse", (PyCFunction)zsp_auth_parse, METH_VARARGS,
		"Parses the incoming ZSP authorization packet"
	},
	{"build", (PyCFunction)zsp_auth_build, METH_VARARGS,
		"Builds the raw packet for transmission"
	},
	{NULL} /* Sentinel */
};

static PyGetSetDef zsp_auth_getseters[] = {
	{"user_hash",
		(getter)zsp_auth_get_user_hash,
		(setter)zsp_auth_set_user_hash,
		"user hash",
		NULL},
	{"pswd_hash",
		(getter)zsp_auth_get_pswd_hash,
		(setter)zsp_auth_set_pswd_hash,
		"password hash",
		NULL},
	{"user_name",
		(getter)zsp_auth_get_user_name,
		(setter)zsp_auth_set_user_name,
		"user name",
		NULL},
	{NULL} /* Sentinel */
};


static PyTypeObject zsp_auth_type = {
	PyObject_HEAD_INIT(NULL)
	0,											/* ob_size */
	"zsp_packets.zsp_auth",						/* tp_name */
	sizeof(zsp_auth),							/* tp_basicsize */
	0,											/* tp_itemsize */
	(destructor)zsp_auth_dealloc,				/* tp_dealloc */
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
	"ZSP Authorization packet",					/* tp_doc */
	0,											/* tp_traverse */
	0,											/* tp_clear */
	0,											/* tp_richcompare */
	0,											/* tp_weaklistoffset */
	0,											/* tp_iter */
	0,											/* tp_iternext */
	zsp_auth_methods,							/* tp_methods */
	zsp_auth_members,							/* tp_members */
	zsp_auth_getseters,							/* tp_getset */
	0,											/* tp_base */
	0,											/* tp_dict */
	0,											/* tp_descr_get */
	0,											/* tp_descr_set */
	0,											/* tp_dictoffset */
	(initproc)zsp_auth_init,					/* tp_init */
	0,											/* tp_alloc */
	zsp_auth_new,								/* tp_new */
};

void initialize_zsp_auth(PyObject *m)
{
	if (PyType_Ready(&zsp_auth_type) < 0)
		return;

	Py_INCREF(&zsp_auth_type);
	PyModule_AddObject(m, "zsp_auth", (PyObject *)&zsp_auth_type);
}

