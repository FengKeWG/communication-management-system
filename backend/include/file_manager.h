#ifndef FILE_MANAGER_H
#define FILE_MANAGER_H

#include "client.h"
#include "sales.h"
#include "communication.h"
#include "group.h"
#include "user.h"

User *loadUsersFromFile(const char *filename);
int saveUsersToFile(const char *filename, User *head);

User *loadUsersFromFile(const char *filename);
int saveUsersToFile(const char *filename, User *head);

Client *loadClientsFromFile(const char *filename);
int saveClientsToFile(const char *filename, Client *head);

Sales *loadSalesFromFile(const char *filename);
int saveSalesToFile(const char *filename, Sales *head);

CommunicationRecord *loadCommunicationsFromFile(const char *filename);
int saveCommunicationsToFile(const char *filename, CommunicationRecord *head);

Group *loadGroupsFromFile(const char *filename);
int saveGroupsToFile(const char *filename, Group *head);

#endif