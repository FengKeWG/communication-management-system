#ifndef UTILS_H
#define UTILS_H
#include <time.h>

#define debug 0

void hashPassword(const char *password, char *hash_out);
int uidGenerate();

#endif