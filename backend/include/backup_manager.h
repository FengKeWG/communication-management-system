#ifndef BACKUP_MANAGER_H
#define BACKUP_MANAGER_H

#include <stdbool.h>

int create_backup();
int list_backups();
int delete_backup(const char *backup_filename);
int restore_backup(const char *backup_filename);

#endif