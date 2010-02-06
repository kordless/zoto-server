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
#include "ZTypes.h"
#include "ZGlobals.h"

extern void initialize_zsp_header(PyObject *m);
extern void initialize_zsp_auth(PyObject *m);
extern void initialize_zsp_auth_resp(PyObject *m);
extern void initialize_zsp_version(PyObject *m);
extern void initialize_zsp_version_resp(PyObject *m);
extern void initialize_zsp_flag(PyObject *m);
extern void initialize_zsp_flag_resp(PyObject *m);
extern void initialize_zsp_file(PyObject *m);
extern void initialize_zsp_file_resp(PyObject *m);
extern void initialize_zsp_done(PyObject *m);
extern void initialize_zsp_done_resp(PyObject *m);
extern void initialize_zsp_error(PyObject *m);

#ifndef PyMODINIT_FUNC
#define PyMODINIT_FUNC void
#endif

static PyMethodDef module_methods[] = {
	{NULL} /* Sentinel */
};

PyMODINIT_FUNC
initzsp_packets(void)
{
	PyObject *m;

	m = Py_InitModule3("zsp_packets", module_methods,
				"Authorization packet.");

	if (m == NULL)
		return;

	PyModule_AddIntConstant(m, "ZSP_NONE", ZSP_NONE);
	PyModule_AddIntConstant(m, "ZSP_QUIT", ZSP_QUIT);
	PyModule_AddIntConstant(m, "ZSP_AUTH", ZSP_AUTH);
	PyModule_AddIntConstant(m, "ZSP_VERSION", ZSP_VERSION);
	PyModule_AddIntConstant(m, "ZSP_FLAG", ZSP_FLAG);
	PyModule_AddIntConstant(m, "ZSP_FILE", ZSP_FILE);
	PyModule_AddIntConstant(m, "ZSP_DONE", ZSP_DONE);
	PyModule_AddIntConstant(m, "ZSP_QUIT_RESP", ZSP_QUIT_RESP);
	PyModule_AddIntConstant(m, "ZSP_AUTH_RESP", ZSP_AUTH_RESP);
	PyModule_AddIntConstant(m, "ZSP_VERSION_RESP", ZSP_VERSION_RESP);
	PyModule_AddIntConstant(m, "ZSP_FLAG_RESP", ZSP_FLAG_RESP);
	PyModule_AddIntConstant(m, "ZSP_FILE_RESP", ZSP_FILE_RESP);
	PyModule_AddIntConstant(m, "ZSP_DONE_RESP", ZSP_DONE_RESP);
	PyModule_AddIntConstant(m, "ZSP_ERROR", ZSP_ERROR);

	PyModule_AddIntConstant(m, "ZSP_JPEG", ZSP_JPEG);
	PyModule_AddIntConstant(m, "ZSP_PNG", ZSP_PNG);
	PyModule_AddIntConstant(m, "ZSP_GIF", ZSP_GIF);
	PyModule_AddIntConstant(m, "ZSP_BMP", ZSP_BMP);
	PyModule_AddIntConstant(m, "ZSP_TIFF", ZSP_TIFF);
	PyModule_AddIntConstant(m, "ZSP_TARGA", ZSP_TARGA);

	// Return codes
	PyModule_AddIntConstant(m, "ZSP_AUTH_OK", ZSP_AUTH_OK);
	PyModule_AddIntConstant(m, "ZSP_AUTH_BAD", ZSP_AUTH_BAD);
	PyModule_AddIntConstant(m, "ZSP_VERS_GOOD", ZSP_VERS_GOOD);
	PyModule_AddIntConstant(m, "ZSP_VERS_OLD", ZSP_VERS_OLD);
	PyModule_AddIntConstant(m, "ZSP_VERS_BAD", ZSP_VERS_BAD);
	PyModule_AddIntConstant(m, "ZSP_FILE_OK", ZSP_FILE_OK);
	PyModule_AddIntConstant(m, "ZSP_FILE_NO_FLAG", ZSP_FILE_NO_FLAG);
	PyModule_AddIntConstant(m, "ZSP_FILE_BAD", ZSP_FILE_BAD);
	PyModule_AddIntConstant(m, "ZSP_DONE_OK", ZSP_DONE_OK);
	PyModule_AddIntConstant(m, "ZSP_DONE_BAD_SUM", ZSP_DONE_BAD_SUM);
	PyModule_AddIntConstant(m, "ZSP_DONE_BAD_SYNC", ZSP_DONE_BAD_SYNC);
	PyModule_AddIntConstant(m, "ZSP_DONE_BAD_SYNC2", ZSP_DONE_BAD_SYNC2);
	PyModule_AddIntConstant(m, "ZSP_DONE_CORRUPT", ZSP_DONE_CORRUPT);
	PyModule_AddIntConstant(m, "ZSP_DONE_BAD_WRITE", ZSP_DONE_BAD_WRITE);

	initialize_zsp_header(m);
	initialize_zsp_auth(m);
	initialize_zsp_auth_resp(m);
	initialize_zsp_version(m);
	initialize_zsp_version_resp(m);
	initialize_zsp_flag(m);
	initialize_zsp_flag_resp(m);
	initialize_zsp_file(m);
	initialize_zsp_file_resp(m);
	initialize_zsp_done(m);
	initialize_zsp_done_resp(m);
	initialize_zsp_error(m);
}

