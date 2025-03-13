// backend/src/main.c
#include <stdio.h>
#include <stdlib.h>
#include "../include/file_manager.h"
#include "../include/client_manager.h"
#include "../include/contact_manager.h"
#include "../include/employee_manager.h"
#include "../include/communication_manager.h"
#include "../include/group_manager.h"

int main()
{
    printf("客户通讯录管理系统启动...\n");

    // 初始化数据（从文件加载）
    Client *clientList = loadClientsFromFile("./data/client.txt");
    Contact *contactList = loadContactsFromFile("./data/contact.txt");
    Employee *employeeList = loadEmployeesFromFile("./data/employee.txt");
    CommunicationRecord *communicationList = loadCommunicationsFromFile("./data/communication.txt");
    Group *groupList = loadGroupsFromFile("./data/group.txt");

    int choice;
    do
    {
        printf("\n请选择操作:\n");
        printf("1. 添加客户\n");
        printf("2. 显示所有客户 (功能待实现)\n"); // 你可以先实现显示所有客户的功能
        printf("3. 保存并退出\n");
        printf("0. 退出\n");
        printf("请选择: ");
        scanf("%d", &choice);
        getchar(); // 读取并丢弃换行符

        switch (choice)
        {
        case 1:
            clientList = addClient(clientList); // 调用 addClient 并更新链表头
            break;
        case 2:
            printf("显示所有客户功能待实现...\n"); // 你可以先实现 displayAllClients 函数
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

    printf("客户通讯录管理系统结束。\n");

    return 0;
}