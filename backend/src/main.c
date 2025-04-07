#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include "../include/file_manager.h"
#include "../include/client_manager.h"
#include "../include/sales_manager.h"
#include "../include/communication_manager.h"
#include "../include/group_manager.h"
#include "../include/user_manager.h"
#include "../include/utils.h"

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
    Communication *communicationList = loadCommunicationsFromFile(communicationFilePath);
    Group *groupList = loadGroupsFromFile(groupFilePath);

    if (argc < 2)
    {
        fprintf(stderr, "错误: 输入命令错误！\n");
        return 1;
    }

    if (strcmp(argv[1], "login") == 0)
    {
        char *username = argv[2];
        char *password = argv[3];
        User *user = authenticateUser(userList, username, password);
        if (user)
        {
            printf("%s %s\n", user->username, user->role);
            fflush(stdout);
        }
        else
        {
            fprintf(stderr, "用户名或密码错误\n");
            return 1;
        }
    }
    else if (strcmp(argv[1], "add_user") == 0)
    {
        User *newUser = parseUserFromString(argv[2], true, true);
        if (!newUser)
        {
            fprintf(stderr, "添加用户错误: 解析用户数据失败或格式错误\n");
            return 1;
        }
        userList = addUser(userList, newUser);
        saveUsersToFile(userFilePath, userList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "get_users") == 0)
    {
        displayUsers(userList, argc, argv);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "delete_user") == 0)
    {
        int userIdToDelete = stoi(argv[2]);
        userList = deleteUser(userList, userIdToDelete);
        saveUsersToFile(userFilePath, userList);
        printf("用户 ID %d 已删除。\n", userIdToDelete);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "update_user") == 0)
    {
        User *newUser = parseUserFromString(argv[2], false, true);
        userList = modifyUser(userList, newUser);
        saveUsersToFile(userFilePath, userList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "add_client") == 0)
    {
        Client *newClient = parseClientFromString(argv[2], true);
        clientList = addClient(clientList, newClient);
        saveClientsToFile(clientFilePath, clientList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "get_clients") == 0)
    {
        displayClients(clientList, argc, argv);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "delete_client") == 0)
    {
        clientList = deleteClient(clientList, atoi(argv[2]));
        saveClientsToFile(clientFilePath, clientList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "update_client") == 0)
    {
        Client *newClient = parseClientFromString(argv[2], false);
        clientList = modifyClient(clientList, newClient);
        saveClientsToFile(clientFilePath, clientList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "add_sales") == 0)
    {
        Sales *newSale = parseSalesFromString(argv[2], true);
        salesList = addSales(salesList, newSale);
        saveSalesToFile(salesFilePath, salesList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "get_sales") == 0)
    {
        displaySales(salesList, argc, argv);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "update_sales") == 0)
    {
        Sales *newSales = parseSalesFromString(argv[2], false);
        salesList = modifySales(salesList, newSales);
        saveSalesToFile(salesFilePath, salesList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "delete_sales") == 0)
    {
        salesList = deleteSales(salesList, atoi(argv[2]));
        saveSalesToFile(salesFilePath, salesList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "display_client_ids_names") == 0)
    {
        displayClientIdsAndNames(clientList);
        fflush(stdout);
    }
    else
    {
        printf("未知命令: %s\n", argv[1]);
        return 1;
    }

    return 0;
}