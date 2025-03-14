// backend/src/main.c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "../include/file_manager.h"
#include "../include/client_manager.h"
#include "../include/contact_manager.h"
#include "../include/employee_manager.h"
#include "../include/communication_manager.h"
#include "../include/group_manager.h"

int main(int argc, char *argv[])
{
    printf("客户通讯录管理系统启动...\n");

    // 初始化数据（从文件加载）
    Client *clientList = loadClientsFromFile("./data/client.txt");
    Contact *contactList = loadContactsFromFile("./data/contact.txt");
    Employee *employeeList = loadEmployeesFromFile("./data/employee.txt");
    CommunicationRecord *communicationList = loadCommunicationsFromFile("./data/communication.txt");
    Group *groupList = loadGroupsFromFile("./data/group.txt");

    // 如果没有命令行参数，进入原有交互模式
    if (argc < 2)
    {
        int choice;
        do
        {
            printf("\n请选择操作:\n");
            printf("1. 添加客户\n");
            printf("2. 显示所有客户\n");
            printf("3. 保存并退出\n");
            printf("0. 退出\n");
            printf("请选择: ");
            scanf("%d", &choice);
            getchar();
            switch (choice)
            {
            case 1:
                clientList = addClient(clientList);
                break;
            case 2:
                displayAllClients(clientList); // 调用新增的显示函数
                break;
            case 3:
                printf("保存数据并退出...\n");
                saveClientsToFile("./data/client.txt", clientList);
                saveContactsToFile("./data/contact.txt", contactList);
                saveEmployeesToFile("./data/employee.txt", employeeList);
                saveCommunicationsToFile("./data/communication.txt", communicationList);
                saveGroupsToFile("./data/group.txt", groupList);
                break;
            case 0:
                printf("退出系统。\n");
                break;
            default:
                printf("无效的选择，请重新输入。\n");
            }
        } while (choice != 0);
    }
    // 处理命令行参数模式
    else
    {
        if (strcmp(argv[1], "add") == 0)
        {
            clientList = addClient(clientList);
            saveClientsToFile("./data/client.txt", clientList); // 添加后自动保存
            printf("[SUCCESS] 客户添加成功\n");
        }
        else if (strcmp(argv[1], "list") == 0)
        {
            displayAllClients(clientList);
        }
        else
        {
            printf("[ERROR] 未知命令: %s\n", argv[1]);
            return 1;
        }
    }

    printf("客户通讯录管理系统结束。\n");
    return 0;
}