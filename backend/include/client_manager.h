#ifndef CLIENT_MANAGER_H
#define CLIENT_MANAGER_H

#include "client.h"
#include "../include/sales_manager.h"

Client *parseClientFromString(char *inputString, bool newID);
Client *addClient(Client *head, Client *newClient);
Client *deleteClient(Client *head, int id);
Client *modifyClient(Client *head, Client *newClient);
void displayClients(Client *head, const char *pattern, int *sortKeys, int sortKeyCount, int filter_sales_id, Sales *salesList);
void displayClientDetails(Client *head, int id);
void displayClientIdsAndNames(Client *head);
void displayClientContactsIdsAndNames(Client *head, int id);

#endif