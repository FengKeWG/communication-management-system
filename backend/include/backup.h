#ifndef BACKUP_H
#define BACKUP_H
#include <time.h>

typedef struct Backup
{
    int id;
    char filename[256];
    time_t creation_time;
    struct Backup *next;
} Backup;

#endif