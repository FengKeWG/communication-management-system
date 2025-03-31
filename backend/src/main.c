#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include "file_manager.h"
#include "client_manager.h"
#include "sales_manager.h"
#include "communication_manager.h"
#include "group_manager.h"
#include "user_manager.h"
#include "utils.h"

int main(int argc, char *argv[])
{
    const char *userFilePath = "./data/user.txt";
    const char *clientFilePath = "./data/client.txt";
    const char *salesFilePath = "./data/sales.txt";
    const char *communicationFilePath = "./data/communication.txt";
    const char *groupFilePath = "./data/group.txt";

    User *userList = loadUsersFromFile(userFilePath);
    Client *clientList = loadClientsFromFile(clientFilePath);
    Sales *salesList = loadSalesFromFile(salesFilePath);
    CommunicationRecord *communicationList = loadCommunicationsFromFile(communicationFilePath);
    Group *groupList = loadGroupsFromFile(groupFilePath);

    if (argc > 1)
    {
        if (strcmp(argv[1], "login") == 0)
        {
            char *username = argv[2];
            char *password = argv[3];
            User *user = authenticateUser(userList, username, password);
            if (user)
            {
                printf("%s %s\n", user->username, user->role);
                fflush(stdout);
                return 0;
            }
            else
            {
                fprintf(stderr, "%s %s\n", user->username, user->role);
                fprintf(stderr, "认证失败: 用户名或密码错误\n");
                return 1;
            }
        }
        else if (strcmp(argv[1], "add_user") == 0)
        {
            User *newUser = parseUserFromString(argv[2], true, true);
            userList = addUser(userList, newUser);
            saveUsersToFile(userFilePath, userList);
        }
        else if (strcmp(argv[1], "add_client") == 0)
        {
            Client *newClient = parseClientFromString(argv[2], true);
            clientList = addClient(clientList, newClient);
            saveClientsToFile(clientFilePath, clientList);
        }
        else if (strcmp(argv[1], "get_clients") == 0)
        {
            displayClients(clientList, argc, argv);
        }
        else if (strcmp(argv[1], "delete_client") == 0)
        {
            clientList = deleteClient(clientList, atoi(argv[2]));
            saveClientsToFile(clientFilePath, clientList);
        }
        else if (strcmp(argv[1], "update_client") == 0)
        {
            Client *newClient = parseClientFromString(argv[2], false);
            clientList = modifyClient(clientList, newClient);
            saveClientsToFile(clientFilePath, clientList);
        }
        else
        {
            printf("未知命令: %s\n", argv[1]);
            return 1;
        }
    }
    return 0;
}