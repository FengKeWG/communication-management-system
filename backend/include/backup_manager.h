#ifndef BACKUP_MANAGER_H
#define BACKUP_MANAGER_H

#include <stdbool.h>

int createBackup();
int listBackups();
int deleteBackup(const char *backup_filename);
int restoreBackup(const char *backup_filename);

#endif