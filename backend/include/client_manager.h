#ifndef CLIENT_MANAGER_H
#define CLIENT_MANAGER_H

#include "client.h"

Client *parseClientFromArgs(int argc, char *argv[], bool newID);
Client *addClient(Client *head, Client *newClient);
Client *deleteClient(Client *head, int id);
Client *modifyClient(Client *head, Client *newClient);
void queryClient(Client *head, int id);
void displayAllClients(Client *head);

#endif