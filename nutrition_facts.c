#define GL_GLEXT_PROTOTYPES

#include<stdio.h>
#include<stdbool.h>
#include<stdlib.h>
#include<stdint.h>

#include <glib.h>
#include <gtk/gtk.h>
#include <gdk/gdkkeysyms.h>
#include <GL/gl.h>
#include <GL/glx.h>
#include <GL/glu.h>
#include <GL/glext.h>
#include <cairo/cairo.h>

#include <librsvg/rsvg.h>
#include "label.h"

#include "sys.h"

#include "shader.h"
const char* vshader = "#version 420\nout gl_PerVertex{vec4 gl_Position;};void main(){gl_Position=vec4(gl_VertexID%2*2-1,gl_VertexID/2*.1-1,1,1);}";

#define CANVAS_WIDTH 1920
#define CANVAS_HEIGHT 1080
#define LABEL_WIDTH 1300
#define LABEL_HEIGHT 1000
#define CHAR_BUFF_SIZE 256

#define DEBUG_FRAG
#define DEBUG_VERT
#define CHAR_BUFFER_SIZE 4096
#define TIME_RENDER
#define EXIT_DURING_RENDER
#define EXIT_USING_ESC_KEY

bool rendered = false;
bool flipped = false;

GdkWindow* window;
#ifdef TIME_RENDER
GTimer* gtimer;
#endif

#ifdef EXIT_USING_ESC_KEY
static gboolean check_escape(GtkWidget *widget, GdkEventKey *event)
{
	(void)widget;
	if (event->keyval == GDK_KEY_Escape) {
		SYS_exit_group(0);
		__builtin_unreachable();
	}

	return FALSE;
}
#endif

__attribute__((always_inline))
static inline void compile_shader()
{
	char* samples = getenv("SAMPLES");
	if (samples == NULL) samples = "300";

	const char* shader_frag_list[] = {"#version 420\n#define SAMPLES ", samples, "\n", shader_frag};
	GLuint f = glCreateShaderProgramv(GL_FRAGMENT_SHADER, 4, shader_frag_list);

	GLuint v = glCreateShaderProgramv(GL_VERTEX_SHADER, 1, &vshader);

	GLuint p;
	glGenProgramPipelines(1, &p);
	glUseProgramStages(p, GL_VERTEX_SHADER_BIT, v);
	glUseProgramStages(p, GL_FRAGMENT_SHADER_BIT, f);
	glBindProgramPipeline(p);

	char charbuf[CHAR_BUFFER_SIZE];
#if defined(DEBUG_FRAG) || defined(DEBUG_VERT)
	if ((p = glGetError()) != GL_NO_ERROR) { //use p to hold the error, lmao
#ifdef DEBUG_FRAG
		glGetProgramInfoLog(f, CHAR_BUFFER_SIZE, NULL, charbuf);
		printf(charbuf);
#endif
#ifdef DEBUG_VERT
		glGetProgramInfoLog(v, CHAR_BUFFER_SIZE, NULL, charbuf);
		printf(charbuf);
#endif
		SYS_exit_group(p);
		__builtin_unreachable();
	}
#endif

	GLuint vao;
	glGenVertexArrays(1, &vao);
	glBindVertexArray(vao);

	GLuint renderedTex;
	glGenTextures(1, &renderedTex);
	glBindTexture(GL_TEXTURE_2D, renderedTex);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

	char* canColor = getenv("CAN_COLOR");
	if (canColor == NULL) canColor = "e82828";
	memcpy(label_svg+102, canColor, 6);
  cairo_surface_t* cairoSurf = cairo_image_surface_create(CAIRO_FORMAT_ARGB32, LABEL_WIDTH, LABEL_HEIGHT);
  cairo_t* cairoCtx = cairo_create(cairoSurf);
	RsvgHandle *handle = rsvg_handle_new_from_data(label_svg, label_svg_len, NULL);
	rsvg_handle_render_cairo(handle, cairoCtx);
	unsigned char* rendered_data = cairo_image_surface_get_data(cairoSurf);

	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, LABEL_WIDTH, LABEL_HEIGHT, 0, GL_BGRA, GL_UNSIGNED_BYTE, rendered_data);
}

static gboolean
on_render (GtkGLArea *glarea, GdkGLContext *context)
{
	(void)context;
	if (rendered || !(gdk_window_get_state(window) & GDK_WINDOW_STATE_FULLSCREEN)) return TRUE;
	if (!flipped) { gtk_gl_area_queue_render(glarea); flipped = true; return TRUE; }
	compile_shader();

#ifdef TIME_RENDER
	gtimer = g_timer_new();
#endif
	rendered = true;
	// glVertexAttrib1f(0, 0);

  for (int i = 0; i < 40; i += 2) {
		glDrawArrays(GL_TRIANGLE_STRIP, i, 4);
#ifdef EXIT_DURING_RENDER
		glFinish();
		while (gtk_events_pending()) gtk_main_iteration();
#endif
  }

#ifdef TIME_RENDER
#ifndef EXIT_DURING_RENDER
	glFinish();
#endif
  printf("render time: %f\n", g_timer_elapsed(gtimer, NULL));
#endif
  return TRUE;
}
__attribute__((__externally_visible__, __section__(".text.startup._start"), __noreturn__))
void _start() {
	asm volatile("push %rax\n");

	typedef void (*voidWithOneParam)(int*);
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wcast-function-type"
	voidWithOneParam gtk_init_one_param = (voidWithOneParam)gtk_init;
#pragma GCC diagnostic pop
	(*gtk_init_one_param)(NULL);

	GtkWidget *win = gtk_window_new (GTK_WINDOW_TOPLEVEL);
	GtkWidget *glarea = gtk_gl_area_new();
	gtk_container_add(GTK_CONTAINER(win), glarea);

	g_signal_connect(win, "destroy", &&quit_asm, NULL);
#ifdef EXIT_USING_ESC_KEY
	g_signal_connect(win, "key_press_event", G_CALLBACK(check_escape), NULL);
#endif
	g_signal_connect(glarea, "render", G_CALLBACK(on_render), NULL);

	gtk_widget_show_all (win);

	gtk_window_fullscreen((GtkWindow*)win);
	window = gtk_widget_get_window(win);
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
	GdkCursor* Cursor = gdk_cursor_new(GDK_BLANK_CURSOR);
#pragma GCC diagnostic pop
	gdk_window_set_cursor(window, Cursor);

	gtk_main();

quit_asm:
	SYS_exit_group(0);
	__builtin_unreachable();
}