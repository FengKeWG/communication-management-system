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
    printf("客户通讯录管理系统启动...\n"); // 打印系统启动信息

    // 初始化数据（从文件加载）
    // 调用 file_manager.h 中声明的函数，从文件中加载数据，并将数据存储到链表中
    // 这些函数假设存在，并且能够正确地读取文件并构建链表
    Client *clientList = loadClientsFromFile("./data/client.txt");                                   // 从 client.txt 文件加载客户信息到 clientList 链表
    Contact *contactList = loadContactsFromFile("./data/contact.txt");                               // 从 contact.txt 文件加载联络人信息到 contactList 链表
    Employee *employeeList = loadEmployeesFromFile("./data/employee.txt");                           // 从 employee.txt 文件加载员工信息到 employeeList 链表
    CommunicationRecord *communicationList = loadCommunicationsFromFile("./data/communication.txt"); // 从 communication.txt 文件加载沟通记录信息到 communicationList 链表
    Group *groupList = loadGroupsFromFile("./data/group.txt");                                       // 从 group.txt 文件加载分组信息到 groupList 链表

    int choice; // 定义一个整型变量 choice，用于存储用户的选择

    // 使用 do-while 循环，重复显示菜单并处理用户的选择，直到用户选择退出
    do
    {
        printf("\n请选择操作:\n"); // 打印菜单
        printf("1. 添加客户\n");
        printf("2. 显示所有客户 (功能待实现)\n"); // 你可以先实现显示所有客户的功能
        printf("3. 保存并退出\n");
        printf("0. 退出\n");
        printf("请选择: "); // 提示用户输入选择

        // 使用 scanf() 函数读取用户输入的整数，并将其存储到 choice 变量中
        scanf("%d", &choice);

        // 使用 getchar() 函数读取并丢弃换行符，防止影响后续输入
        getchar(); // 读取并丢弃换行符

        // 使用 switch 语句，根据用户的选择执行相应的操作
        switch (choice)
        {
        case 1:
            // 调用 client_manager.h 中声明的 addClient() 函数，添加客户信息
            // 并将返回的新链表头赋值给 clientList，以更新链表
            clientList = addClient(clientList); // 调用 addClient 并更新链表头
            break;
        case 2:
            // 显示所有客户信息 (功能待实现)
            printf("显示所有客户功能待实现...\n"); // 你可以先实现 displayAllClients 函数
            break;
        case 3:
            // 保存数据并退出
            printf("保存数据并退出...\n");

            // 调用 file_manager.h 中声明的函数，将链表中的数据保存到文件中
            saveClientsToFile("./data/client.txt", clientList);                      // 将 clientList 链表中的客户信息保存到 client.txt 文件
            saveContactsToFile("./data/contact.txt", contactList);                   // 将 contactList 链表中的联络人信息保存到 contact.txt 文件
            saveEmployeesToFile("./data/employee.txt", employeeList);                // 将 employeeList 链表中的员工信息保存到 employee.txt 文件
            saveCommunicationsToFile("./data/communication.txt", communicationList); // 将 communicationList 链表中的沟通记录信息保存到 communication.txt 文件
            saveGroupsToFile("./data/group.txt", groupList);                         // 将 groupList 链表中的分组信息保存到 group.txt 文件
            break;
        case 0:
            // 退出系统
            printf("退出系统。\n");
            break;
        default:
            // 无效的选择，提示用户重新输入
            printf("无效的选择，请重新输入。\n");
        }
    } while (choice != 0); // 当用户选择 0 时，退出循环

    printf("客户通讯录管理系统结束。\n"); // 打印系统结束信息

    return 0; // 返回 0，表示程序正常结束
}