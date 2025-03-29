#ifndef CLIENT_MANAGER_H
#define CLIENT_MANAGER_H

#include "client.h"

Client *parseClientFromString(char *inputString, bool newID);
Client *addClient(Client *head, Client *newClient);
Client *deleteClient(Client *head, int id);
Client *modifyClient(Client *head, Client *newClient);
void displayClients(Client *head, int argc, char *argv[]);
#endif