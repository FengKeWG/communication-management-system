#ifndef BACKUP_MANAGER_H
#define BACKUP_MANAGER_H

#include <stdbool.h>
#include "backup.h"

#define BACKUP_DIRECTORY "./backups/"
#define DATA_DIRECTORY "./data"

Backup *loadBackupsToList();
void freeBackupList(Backup *head);
void displayBackups(Backup *head, const char *pattern, int *sortKeys, int sortKeyCount);
int performBackup(Backup **headRef);
int deleteBackupByFilename(Backup **headRef, const char *filenameToDelete);
int restoreFromBackupByFilename(Backup *head, const char *filenameToRestore);

#endif