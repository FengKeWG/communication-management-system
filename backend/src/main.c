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
        if (argc < 4)
        {
            return 1;
        }
        char *username = argv[2];
        char *password = argv[3];
        User *user = authenticateUser(userList, username, password);
        if (user)
        {
            printf("%s %s %d\n", user->username, user->role, user->sales_id);
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
        if (argc < 3)
        {
            return 1;
        }
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
            for (int i = 0; i < sortKeyCount; ++i)
                sortKeys[i] = stoi(argv[3 + i]);
        displayUsers(userList, searchPattern, sortKeys, sortKeyCount);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "delete_user") == 0)
    {
        int userIdToDelete = stoi(argv[2]);
        userList = deleteUser(userList, userIdToDelete);
        saveUsersToFile(userFilePath, userList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "update_user") == 0)
    {
        if (argc < 3)
        {
            return 1;
        }
        // 假设 argv[2] 的格式是 "id;username;[new_password_or_empty];role;sales_id"
        // parseUserFromString 需要能处理密码为空的情况（表示不修改密码）
        // 并且 modifyUser 需要正确处理密码更新逻辑

        // 1. 先查找旧用户，保留旧密码哈希（如果需要）
        char tempStr[1024];
        scpy(tempStr, argv[2], sizeof(tempStr));
        char *idStr = strtok(tempStr, ";");
        int userIdToUpdate = (idStr != NULL) ? stoi(idStr) : 0;
        User *existingUser = findUserById(userList, userIdToUpdate); // 需要实现 findUserById
        char oldPasswordHash[65] = "";
        if (existingUser)
        {
            scpy(oldPasswordHash, existingUser->password_hash, sizeof(oldPasswordHash));
        }

        // 2. 解析输入字符串
        User *updatedUser = parseUserFromString(argv[2], false, true); // newID=false, hash=true (如果提供了新密码)
        if (!updatedUser)
        { /* 错误处理 */
            return 1;
        }

        // 3. 如果解析出的密码哈希为空（表示没提供新密码），则恢复旧密码哈希
        if (strlen(updatedUser->password_hash) == 0 && existingUser)
        {
            scpy(updatedUser->password_hash, oldPasswordHash, sizeof(updatedUser->password_hash));
        }

        // 4. 调用修改函数
        userList = modifyUser(userList, updatedUser); // modifyUser 内部应释放 updatedUser
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
        if (argc < 3)
        {
            fprintf(stderr, "错误: get_clients 参数不足\n");
            return 1;
        }

        char searchPattern[10000]; // 通用搜索
        scpy(searchPattern, argv[2], sizeof(searchPattern));
        toLower(searchPattern);

        int sortKeys[100];
        int sortKeyCount = 0;
        int filter_sales_id = 0;

        // **** 修改开始: 定义并初始化所有搜索参数指针 ****
        char *searchNameParam = NULL;
        char *searchRegionParam = NULL;
        char *searchAddressParam = NULL;
        char *searchLegalPersonParam = NULL;
        char *searchSizeParam = NULL;         // 接收字符串
        char *searchContactLevelParam = NULL; // 接收字符串
        char *searchEmailParam = NULL;
        char *searchContactCountParam = NULL;
        // **** 修改结束 ****

        // 解析参数 (从第 3 个开始)
        for (int i = 3; i < argc; i++)
        {
            if (strncmp(argv[i], "filter_sales_id=", 16) == 0)
            {
                filter_sales_id = stoi(argv[i] + 16);
            }
            // **** 修改开始: 解析所有 key=value 参数 ****
            else if (strncmp(argv[i], "name=", 5) == 0)
            {
                searchNameParam = argv[i] + 5;
                toLower(searchNameParam);
            }
            else if (strncmp(argv[i], "region=", 7) == 0)
            {
                searchRegionParam = argv[i] + 7;
                toLower(searchRegionParam);
            }
            else if (strncmp(argv[i], "address=", 8) == 0)
            {
                searchAddressParam = argv[i] + 8;
                toLower(searchAddressParam);
            }
            else if (strncmp(argv[i], "legal_person=", 13) == 0)
            {
                searchLegalPersonParam = argv[i] + 13;
                toLower(searchLegalPersonParam);
            }
            else if (strncmp(argv[i], "size=", 5) == 0)
            {
                searchSizeParam = argv[i] + 5; /* Size不转小写，保持数字字符串 */
            }
            else if (strncmp(argv[i], "contact_level=", 14) == 0)
            {
                searchContactLevelParam = argv[i] + 14; /* Level不转小写 */
            }
            else if (strncmp(argv[i], "email=", 6) == 0)
            {
                searchEmailParam = argv[i] + 6;
                toLower(searchEmailParam);
            }
            else if (strncmp(argv[i], "contact_count=", 14) == 0)
            {
                searchContactCountParam = argv[i] + 14;
            }
            // **** 修改结束 ****
            // 否则，尝试解析为排序键
            else if (sortKeyCount < 100)
            {
                bool isSortKey = true;
                int k = (argv[i][0] == '-') ? 1 : 0;
                if (argv[i][k] == '\0')
                    isSortKey = false; // 只有 '-' 不行
                for (; argv[i][k] != '\0'; k++)
                {
                    if (!isdigit(argv[i][k]))
                    {
                        isSortKey = false;
                        break;
                    }
                }
                if (isSortKey)
                {
                    sortKeys[sortKeyCount++] = stoi(argv[i]);
                }
                else
                {
                    // fprintf(stderr, "警告: 忽略未知参数 %s\n", argv[i]);
                }
            }
        }

        if (sortKeyCount == 0)
        {
            sortKeys[0] = 1;
            sortKeyCount = 1;
        }

        // **** 修改开始: 将所有参数传递给 displayClients ****
        displayClients(clientList,
                       searchPattern, // 通用
                       sortKeys, sortKeyCount,
                       filter_sales_id, salesList,
                       searchNameParam, searchRegionParam, searchAddressParam,
                       searchLegalPersonParam, searchSizeParam,
                       searchContactLevelParam, searchEmailParam,
                       searchContactCountParam);
        // **** 修改结束 ****
        fflush(stdout);
    }
    else if (strcmp(argv[1], "delete_client") == 0)
    {
        clientList = deleteClient(clientList, stoi(argv[2]));
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
        if (argc < 3)
        { /* 错误处理 */
            return 1;
        }
        char searchPattern[10000]; // 通用
        scpy(searchPattern, argv[2], sizeof(searchPattern));
        toLower(searchPattern);

        int sortKeys[100], sortKeyCount = 0;
        // **** 新增: sales 搜索参数指针 ****
        char *searchNameParam = NULL;
        char *searchEmailParam = NULL;
        char *searchClientCountParam = NULL;
        // **** 结束新增 ****

        for (int i = 3; i < argc; i++)
        {
            // **** 新增: 解析 sales 参数 ****
            if (strncmp(argv[i], "name=", 5) == 0)
            {
                searchNameParam = argv[i] + 5;
                toLower(searchNameParam);
            }
            else if (strncmp(argv[i], "email=", 6) == 0)
            {
                searchEmailParam = argv[i] + 6;
                toLower(searchEmailParam);
            }
            else if (strncmp(argv[i], "client_count=", 13) == 0)
            {
                searchClientCountParam = argv[i] + 13; /* 数字不转小写 */
            }
            // **** 结束新增 ****
            // 否则尝试解析排序键
            else if (sortKeyCount < 100)
            {
                bool isSortKey = true; /* ... (isSortKey 判断逻辑不变) ... */
                if (isSortKey)
                    sortKeys[sortKeyCount++] = stoi(argv[i]);
                else
                { /* 忽略未知参数 */
                }
            }
        }
        if (sortKeyCount == 0)
        {
            sortKeys[0] = 1;
            sortKeyCount = 1;
        }

        // **** 修改: 传递新参数给 displaySales ****
        displaySales(salesList, searchPattern, sortKeys, sortKeyCount,
                     searchNameParam, searchEmailParam, searchClientCountParam);
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
        salesList = deleteSales(salesList, stoi(argv[2]));
        saveSalesToFile(salesFilePath, salesList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "display_client_ids_names") == 0)
    {
        displayClientIdsAndNames(clientList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "display_sales_ids_names") == 0)
    {
        displaySalesIdsAndNames(salesList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "display_client_contacts") == 0)
    {
        int clientId = stoi(argv[2]);
        displayClientContactsIdsAndNames(clientList, clientId);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "add_communication") == 0)
    {
        Communication *newComm = parseCommunicationFromString(argv[2], true);
        communicationList = addCommunication(communicationList, newComm);
        saveCommunicationsToFile(communicationFilePath, communicationList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "get_communications") == 0)
    {
        if (argc < 3)
        { /* 错误处理 */
            return 1;
        }
        char searchPattern[10000]; // 通用
        scpy(searchPattern, argv[2], sizeof(searchPattern));
        toLower(searchPattern);

        int sortKeys[100], sortKeyCount = 0, filter_sales_id = 0;
        // **** 新增: communication 搜索参数指针 ****
        char *searchClientIdParam = NULL;
        char *searchContactIdParam = NULL;
        char *searchSalesIdParam = NULL;
        char *searchDurationParam = NULL;
        char *searchContentParam = NULL;
        // **** 结束新增 ****

        for (int i = 3; i < argc; ++i)
        {
            if (strncmp(argv[i], "filter_sales_id=", 16) == 0)
            {
                filter_sales_id = stoi(argv[i] + 16);
            }
            // **** 新增: 解析 comm 参数 ****
            else if (strncmp(argv[i], "client_id=", 10) == 0)
            {
                searchClientIdParam = argv[i] + 10; /* ID不转小写 */
            }
            else if (strncmp(argv[i], "contact_id=", 11) == 0)
            {
                searchContactIdParam = argv[i] + 11; /* ID不转小写 */
            }
            else if (strncmp(argv[i], "sales_id=", 9) == 0)
            {
                searchSalesIdParam = argv[i] + 9; /* ID不转小写 */
            }
            else if (strncmp(argv[i], "duration=", 9) == 0)
            {
                searchDurationParam = argv[i] + 9; /* 数字不转小写 */
            }
            else if (strncmp(argv[i], "content=", 8) == 0)
            {
                searchContentParam = argv[i] + 8;
                toLower(searchContentParam);
            }
            // **** 结束新增 ****
            // 否则尝试解析排序键
            else if (sortKeyCount < 100)
            {
                bool isSortKey = true; /* ... (isSortKey 判断逻辑不变) ... */
                if (isSortKey)
                    sortKeys[sortKeyCount++] = stoi(argv[i]);
                else
                { /* 忽略未知参数 */
                }
            }
        }
        if (sortKeyCount == 0)
        {
            sortKeys[0] = 1;
            sortKeyCount = 1;
        }

        // **** 修改: 传递新参数给 displayCommunication ****
        displayCommunication(communicationList, searchPattern, sortKeys, sortKeyCount, filter_sales_id,
                             searchClientIdParam, searchContactIdParam, searchSalesIdParam,
                             searchDurationParam, searchContentParam);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "update_communication") == 0)
    {
        Communication *updatedComm = parseCommunicationFromString(argv[2], false);
        communicationList = modifyCommunication(communicationList, updatedComm);
        saveCommunicationsToFile(communicationFilePath, communicationList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "change_password") == 0)
    {
        char *username = argv[2];
        char *oldPassword = argv[3];
        char *newPassword = argv[4];
        int result = changeUserPassword(userList, username, oldPassword, newPassword);
        if (result == 0)
        {
            if (saveUsersToFile(userFilePath, userList) != 0)
            {
                fprintf(stderr, "密码修改成功，但保存文件失败！\n");
                return 1;
            }
            return 0;
        }
        else
        {
            return 1;
        }
        fflush(stdout);
        fflush(stderr);
    }
    else if (strcmp(argv[1], "display_unlinked_sales") == 0)
    {
        displayUnlinkedSales(salesList, userList);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "verify_sales_identity") == 0)
    {
        if (argc < 8)
        {
            fprintf(stderr, "错误: 参数不足。用法: ./main verify_sales_identity <username> <name> <year> <month> <day> <email>\n");
            return 1;
        }
        char *username = argv[2];
        char *name = argv[3];
        int year = stoi(argv[4]);
        int month = stoi(argv[5]);
        int day = stoi(argv[6]);
        char *email = argv[7];

        // 调用验证函数 (确保 salesList 已加载)
        int result = verifySalesIdentity(userList, salesList, username, name, year, month, day, email);
        if (result != 0)
        {
            // 错误信息已在 verifySalesIdentity 内部打印到 stderr
            return 1; // 返回错误码，让 Flask 知道失败了
        }
        // 成功信息已在 verifySalesIdentity 内部打印到 stdout
        fflush(stdout); // 确保输出
    }
    else if (strcmp(argv[1], "reset_password") == 0)
    {
        if (argc < 4)
        {
            fprintf(stderr, "错误: 参数不足。用法: ./main reset_password <username> <new_password>\n");
            return 1;
        }
        char *username = argv[2];
        char *newPassword = argv[3];

        int result = resetUserPassword(userList, username, newPassword);
        if (result == 0)
        {
            // 重置成功，保存用户文件
            if (saveUsersToFile(userFilePath, userList) == 0)
            {
                // 成功信息已在 resetUserPassword 内部打印到 stdout
                fflush(stdout);
            }
            else
            {
                fprintf(stderr, "错误: 密码重置成功，但保存用户文件失败！\n");
                return 1; // 保存失败
            }
        }
        else
        {
            // 错误信息已在 resetUserPassword 内部打印到 stderr
            return 1; // 重置失败
        }
    }
    else if (strcmp(argv[1], "add_group") == 0)
    {
        if (argc < 3)
        { /* 错误处理 */
            return 1;
        }
        Group *newGroup = parseGroupFromString(argv[2], true); // true 表示生成新 ID
        if (!newGroup)
        {
            fprintf(stderr, "添加分组错误: 解析数据失败\n");
            return 1;
        }
        groupList = addGroup(groupList, newGroup);
        saveGroupsToFile(groupFilePath, groupList);
    }
    else if (strcmp(argv[1], "get_groups") == 0)
    {
        if (argc < 3)
        { /* 错误处理 */
            return 1;
        }
        char searchPattern[10000]; // 通用
        scpy(searchPattern, argv[2], sizeof(searchPattern));
        toLower(searchPattern);

        int sortKeys[100], sortKeyCount = 0;
        // **** 新增: group 搜索参数指针 ****
        char *searchNameParam = NULL;
        char *searchClientCountParam = NULL;
        // **** 结束新增 ****

        for (int i = 3; i < argc; i++)
        {
            // **** 新增: 解析 group 参数 ****
            if (strncmp(argv[i], "name=", 5) == 0)
            {
                searchNameParam = argv[i] + 5;
                toLower(searchNameParam);
            }
            else if (strncmp(argv[i], "client_count=", 13) == 0)
            {
                searchClientCountParam = argv[i] + 13; /* 数字不转小写 */
            }
            // **** 结束新增 ****
            // 否则尝试解析排序键
            else if (sortKeyCount < 100)
            {
                bool isSortKey = true; /* ... (isSortKey 判断逻辑不变) ... */
                if (isSortKey)
                    sortKeys[sortKeyCount++] = stoi(argv[i]);
                else
                { /* 忽略未知参数 */
                }
            }
        }
        if (sortKeyCount == 0)
        {
            sortKeys[0] = 1;
            sortKeyCount = 1;
        }

        // **** 修改: 传递新参数给 displayGroups ****
        displayGroups(groupList, searchPattern, sortKeys, sortKeyCount,
                      searchNameParam, searchClientCountParam);
        fflush(stdout);
    }
    else if (strcmp(argv[1], "update_group") == 0)
    {
        if (argc < 3)
        { /* 错误处理 */
            return 1;
        }
        Group *updatedGroup = parseGroupFromString(argv[2], false); // false 表示 ID 已存在
        if (!updatedGroup)
        {
            fprintf(stderr, "更新分组错误: 解析数据失败\n");
            return 1;
        }
        groupList = modifyGroup(groupList, updatedGroup);
        saveGroupsToFile(groupFilePath, groupList);
    }
    else if (strcmp(argv[1], "delete_group") == 0)
    {
        if (argc < 3)
        { /* 错误处理 */
            return 1;
        }
        int groupIdToDelete = stoi(argv[2]);
        if (groupIdToDelete <= 0)
        {
            fprintf(stderr, "删除分组错误: 无效的 ID '%s'\n", argv[2]);
            return 1;
        }
        groupList = deleteGroup(groupList, groupIdToDelete);
        saveGroupsToFile(groupFilePath, groupList);
    }
    else if (strcmp(argv[1], "create_backup") == 0)
    {
        if (create_backup() != 0)
        {
            // 错误信息已在 create_backup 内部打印到 stderr
            // 释放内存... (略)
            return 1; // 返回错误码给 Flask
        }
        // 成功信息已在 create_backup 内部打印到 stdout
    }
    else if (strcmp(argv[1], "list_backups") == 0)
    {
        if (list_backups() != 0)
        {
            // 错误信息已在 list_backups 内部打印到 stderr
            // 释放内存... (略)
            return 1;
        }
        // 列表已由 list_backups 打印到 stdout
    }
    else if (strcmp(argv[1], "delete_backup") == 0)
    {
        if (argc < 3)
        {
            fprintf(stderr, "错误: 删除备份需要提供备份文件名。\n");
            // 释放内存... (略)
            return 1;
        }
        if (delete_backup(argv[2]) != 0)
        {
            // 错误信息已在 delete_backup 内部打印到 stderr
            // 释放内存... (略)
            return 1;
        }
        // 成功信息已在 delete_backup 内部打印到 stdout
    }
    else if (strcmp(argv[1], "restore_backup") == 0)
    {
        if (argc < 3)
        {
            fprintf(stderr, "错误: 恢复备份需要提供备份文件名。\n");
            // 释放内存... (略)
            return 1;
        }
        if (restore_backup(argv[2]) != 0)
        {
            // 错误信息已在 restore_backup 内部打印到 stderr
            // 释放内存... (略)
            return 1;
        }
        // 成功信息已在 restore_backup 内部打印到 stdout
    }
    else
    {
        printf("未知命令: %s\n", argv[1]);
        return 1;
    }

    return 0;
}