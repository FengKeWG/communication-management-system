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
#include "../include/backup_manager.h"
#include "../include/utils.h"

const char *userFilePath = "./data/user.txt";
const char *clientFilePath = "./data/client.txt";
const char *salesFilePath = "./data/sales.txt";
const char *communicationFilePath = "./data/communication.txt";
const char *groupFilePath = "./data/group.txt";

int processCommand(int argc, char *argv[], User *userList, Client *clientList, Sales *salesList, Communication *communicationList, Group *groupList)
{
    if (strcmp(argv[1], "login") == 0)
    {
        char *username = argv[2];
        char *password = argv[3];
        User *user = authenticateUser(userList, username, password);
        if (user)
        {
            printf("%s %s %d\n", user->username, user->role, user->sales_id);
            return 0;
        }
        return 1;
    }
    else if (strcmp(argv[1], "add_user") == 0)
    {
        User *newUser = parseUserFromString(argv[2], true, true);
        if (newUser)
        {
            userList = addUser(userList, newUser);
            saveUsersToFile(userFilePath, userList);
            return 0;
        }
        return 1;
    }
    else if (strcmp(argv[1], "get_users") == 0)
    {
        char searchPattern[10000];
        scpy(searchPattern, argv[2], sizeof(searchPattern));
        toLower(searchPattern);
        int sortKeys[100];
        int sortKeyCount = argc - 3;
        if (sortKeyCount <= 0)
        {
            sortKeys[0] = 1;
            sortKeyCount = 1;
        }
        else
            for (int i = 0; i < sortKeyCount; i++)
                sortKeys[i] = stoi(argv[3 + i]);
        displayUsers(userList, searchPattern, sortKeys, sortKeyCount);
        return 0;
    }
    else if (strcmp(argv[1], "delete_user") == 0)
    {
        int userIdToDelete = stoi(argv[2]);
        userList = deleteUser(userList, userIdToDelete);
        if (userList)
        {
            saveUsersToFile(userFilePath, userList);
            return 0;
        }
        return 1;
    }
    else if (strcmp(argv[1], "update_user") == 0)
    {
        User *newUser = parseUserFromString(argv[2], false, true);
        if (newUser)
        {
            if (strlen(newUser->password_hash) == 0)
                scpy(newUser->password_hash, getPasswordHashById(userList, newUser->id), sizeof(newUser->password_hash));
            userList = modifyUser(userList, newUser);
            saveUsersToFile(userFilePath, userList);
            return 0;
        }
        return 1;
    }
    else if (strcmp(argv[1], "add_client") == 0)
    {
        Client *newClient = parseClientFromString(argv[2], true);
        if (newClient)
        {
            clientList = addClient(clientList, newClient);
            saveClientsToFile(clientFilePath, clientList);
            return 0;
        }
        return 1;
    }
    else if (strcmp(argv[1], "get_clients") == 0)
    {
        char *filterSalesIdStr = argv[2];
        char *searchPattern = argv[3];
        char *searchNameParam = argv[4];
        char *searchRegionParam = argv[5];
        char *searchAddressParam = argv[6];
        char *searchLegalPersonParam = argv[7];
        char *searchSizeParam = argv[8];
        char *searchContactLevelParam = argv[9];
        char *searchEmailParam = argv[10];
        char *searchContactCountParam = argv[11];
        int filter_sales_id = stoi(filterSalesIdStr);
        int sortKeys[100];
        int sortKeyCount = 0;
        for (int i = 12; i < argc; i++)
            sortKeys[sortKeyCount++] = stoi(argv[i]);
        displayClients(clientList, searchPattern, sortKeys, sortKeyCount, filter_sales_id, salesList, searchNameParam, searchRegionParam, searchAddressParam, searchLegalPersonParam, searchSizeParam, searchContactLevelParam, searchEmailParam, searchContactCountParam);
        return 0;
    }
    else if (strcmp(argv[1], "delete_client") == 0)
    {
        clientList = deleteClient(clientList, stoi(argv[2]));
        saveClientsToFile(clientFilePath, clientList);
        return 0;
    }
    else if (strcmp(argv[1], "update_client") == 0)
    {
        Client *newClient = parseClientFromString(argv[2], false);
        if (newClient)
        {
            clientList = modifyClient(clientList, newClient);
            saveClientsToFile(clientFilePath, clientList);
            return 0;
        }
        return 1;
    }
    else if (strcmp(argv[1], "add_sales") == 0)
    {
        Sales *newSale = parseSalesFromString(argv[2], true);
        if (newSale)
        {
            salesList = addSales(salesList, newSale);
            saveSalesToFile(salesFilePath, salesList);
            return 0;
        }
        return 1;
    }
    else if (strcmp(argv[1], "get_sales") == 0)
    {
        char *searchPattern = argv[2];
        char *searchNameParam = argv[3];
        char *searchEmailParam = argv[4];
        char *searchClientCountParam = argv[5];
        int sortKeys[100];
        int sortKeyCount = 0;
        for (int i = 5; i < argc; i++)
            sortKeys[sortKeyCount++] = stoi(argv[i]);
        displaySales(salesList, searchPattern, sortKeys, sortKeyCount,
                     searchNameParam, searchEmailParam, searchClientCountParam);
        return 0;
    }
    else if (strcmp(argv[1], "update_sales") == 0)
    {
        Sales *newSales = parseSalesFromString(argv[2], false);
        if (newSales)
        {
            salesList = modifySales(salesList, newSales);
            saveSalesToFile(salesFilePath, salesList);
            return 0;
        }
        return 1;
    }
    else if (strcmp(argv[1], "delete_sales") == 0)
    {
        salesList = deleteSales(salesList, stoi(argv[2]));
        saveSalesToFile(salesFilePath, salesList);
        return 0;
    }
    else if (strcmp(argv[1], "display_client_ids_names") == 0)
    {
        displayClientIdsAndNames(clientList);
        return 0;
    }
    else if (strcmp(argv[1], "display_sales_ids_names") == 0)
    {
        displaySalesIdsAndNames(salesList);
        return 0;
    }
    else if (strcmp(argv[1], "display_client_contacts") == 0)
    {
        int clientId = stoi(argv[2]);
        displayClientContactsIdsAndNames(clientList, clientId);
        return 0;
    }
    else if (strcmp(argv[1], "add_communication") == 0)
    {
        Communication *newComm = parseCommunicationFromString(argv[2], true);
        if (newComm)
        {
            communicationList = addCommunication(communicationList, newComm);
            saveCommunicationsToFile(communicationFilePath, communicationList);
            return 0;
        }
        return 1;
    }
    else if (strcmp(argv[1], "get_communications") == 0)
    {
        char *filterSalesIdStr = argv[2];
        char *searchPattern = argv[3];
        char *searchClientIdParam = argv[4];
        char *searchContactIdParam = argv[5];
        char *searchSalesIdParam = argv[6];
        char *searchDurationParam = argv[7];
        char *searchContentParam = argv[8];
        int filter_sales_id = stoi(filterSalesIdStr);
        int sortKeys[100];
        int sortKeyCount = 0;
        for (int i = 9; i < argc; i++)
            sortKeys[sortKeyCount++] = stoi(argv[i]);
        displayCommunication(communicationList, searchPattern, sortKeys, sortKeyCount, filter_sales_id, searchClientIdParam, searchContactIdParam, searchSalesIdParam, searchDurationParam, searchContentParam);
        return 0;
    }
    else if (strcmp(argv[1], "update_communication") == 0)
    {
        Communication *updatedComm = parseCommunicationFromString(argv[2], false);
        if (updatedComm)
        {
            communicationList = modifyCommunication(communicationList, updatedComm);
            saveCommunicationsToFile(communicationFilePath, communicationList);
            return 0;
        }
        return 1;
    }
    else if (strcmp(argv[1], "change_password") == 0)
    {
        char *username = argv[2];
        char *oldPassword = argv[3];
        char *newPassword = argv[4];
        char *confirmPassword = argv[5];
        if (!changeUserPassword(userList, username, oldPassword, newPassword, confirmPassword))
        {
            saveUsersToFile(userFilePath, userList);
            return 0;
        }
        return 1;
    }
    else if (strcmp(argv[1], "display_unlinked_sales") == 0)
    {
        displayUnlinkedSales(salesList, userList);
        return 0;
    }
    else if (strcmp(argv[1], "verify_sales_identity") == 0)
    {
        char *username = argv[2];
        char *name = argv[3];
        int year = stoi(argv[4]);
        int month = stoi(argv[5]);
        int day = stoi(argv[6]);
        char *email = argv[7];
        if (!verifySalesIdentity(userList, salesList, username, name, year, month, day, email))
            return 0;
        return 1;
    }
    else if (strcmp(argv[1], "reset_password") == 0)
    {
        char *username = argv[2];
        char *newPassword = argv[3];
        if (!resetUserPassword(userList, username, newPassword))
        {
            saveUsersToFile(userFilePath, userList);
            return 0;
        }
        return 1;
    }
    else if (strcmp(argv[1], "add_group") == 0)
    {
        Group *newGroup = parseGroupFromString(argv[2], true);
        if (newGroup)
        {
            groupList = addGroup(groupList, newGroup);
            saveGroupsToFile(groupFilePath, groupList);
            return 0;
        }
        return 1;
    }
    else if (strcmp(argv[1], "get_groups") == 0)
    {
        char *searchPattern = argv[2];
        char *searchNameParam = argv[3];
        char *searchClientCountParam = argv[4];
        int sortKeys[100];
        int sortKeyCount = 0;
        for (int i = 5; i < argc; i++)
            sortKeys[sortKeyCount++] = stoi(argv[i]);
        displayGroups(groupList, searchPattern, sortKeys, sortKeyCount, searchNameParam, searchClientCountParam);
        return 0;
    }
    else if (strcmp(argv[1], "update_group") == 0)
    {
        Group *newGroup = parseGroupFromString(argv[2], false);
        if (newGroup)
        {
            groupList = modifyGroup(groupList, newGroup);
            saveGroupsToFile(groupFilePath, groupList);
            return 0;
        }
        return 1;
    }
    else if (strcmp(argv[1], "delete_group") == 0)
    {
        groupList = deleteGroup(groupList, stoi(argv[2]));
        saveGroupsToFile(groupFilePath, groupList);
        return 0;
    }
    else if (strcmp(argv[1], "create_backup") == 0)
    {
        if (!createBackup())
            return 0;
        return 1;
    }
    else if (strcmp(argv[1], "list_backups") == 0)
    {
        if (!listBackups())
            return 0;
        return 1;
    }
    else if (strcmp(argv[1], "delete_backup") == 0)
    {
        if (!deleteBackup(argv[2]))
            return 0;
        return 1;
    }
    else if (strcmp(argv[1], "restore_backup") == 0)
    {
        if (!restoreBackup(argv[2]))
            return 0;
        return 1;
    }
    else
    {
        fprintf(stderr, "未知命令: %s\n", argv[1]);
        return 1;
    }
}

int main(int argc, char *argv[])
{
    User *userList = loadUsersFromFile(userFilePath);
    Client *clientList = loadClientsFromFile(clientFilePath);
    Sales *salesList = loadSalesFromFile(salesFilePath);
    Communication *communicationList = loadCommunicationsFromFile(communicationFilePath);
    Group *groupList = loadGroupsFromFile(groupFilePath);

    int exit_code = processCommand(argc, argv, userList, clientList, salesList, communicationList, groupList);

    freeUserList(userList);
    freeClientList(clientList);
    freeSalesList(salesList);
    freeCommunicationList(communicationList);
    freeGroupList(groupList);

    fflush(stdout);
    fflush(stderr);

    return exit_code;
}