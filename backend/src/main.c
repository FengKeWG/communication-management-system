#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include "file_manager.h"
#include "client_manager.h"
#include "contact_manager.h"
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
    const char *contactFilePath = "./data/contact.txt";
    const char *communicationFilePath = "./data/communication.txt";
    const char *groupFilePath = "./data/group.txt";

    User *userList = loadUsersFromFile(userFilePath);
    Client *clientList = loadClientsFromFile(clientFilePath);
    Contact *contactList = loadContactsFromFile(contactFilePath);
    Sales *salesList = loadSalesFromFile(salesFilePath);
    CommunicationRecord *communicationList = loadCommunicationsFromFile(communicationFilePath);
    Group *groupList = loadGroupsFromFile(groupFilePath);

    if (argc > 1)
    {
        if (strcmp(argv[1], "login") == 0)
        {
            const char *username = argv[2];
            const char *password = argv[3];
            if (debug)
                fprintf(stderr, "调试信息: 接收到用户名 '%s', 密码 '%s'\n", username, password);
            User *user = authenticateUser(userList, username, password);
            if (user)
            {
                printf("%s %s\n", user->username, user->role);
                fflush(stdout);
                return 0;
            }
            else
            {
                fprintf(stderr, "认证失败: 用户名或密码错误\n");
                return 1;
            }
        }
        else if (strcmp(argv[1], "add_user") == 0)
        {
            User *newUser = parseUserFromArgs(argc, argv);
            userList = addUser(userList, newUser);
            saveUsersToFile(userFilePath, userList);
        }
        else if (strcmp(argv[1], "add_client") == 0)
        {
            Client *newClient = parseClientFromArgs(argc, argv, true);
            clientList = addClient(clientList, newClient);
            saveClientsToFile(clientFilePath, clientList);
        }
        else if (strcmp(argv[1], "list_client") == 0)
        {
            displayAllClients(clientList);
        }
        else
        {
            printf("未知命令: %s\n", argv[1]);
            return 1;
        }
    }
    return 0;
}