#ifndef CLIENT_MANAGER_H
#define CLIENT_MANAGER_H

#include "client.h"

// 函数声明
Client *addClient(Client *head);
Client *deleteClient(Client *head, int id);
Client *modifyClient(Client *head, int id);
void queryClient(Client *head, int id);
void displayAllClients(Client *head);

#endif