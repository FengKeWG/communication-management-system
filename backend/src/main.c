#include <stdio.h>
#include "file_manager.h" // 引入文件管理模块
#include "client.h"
#include "contact.h"
#include "employee.h"
#include "communication.h"
#include "group.h"

int main()
{
    printf("客户通讯录管理系统启动...\n");

    // 初始化数据（从文件加载）
    Client *clientList = loadClientsFromFile("./data/client.txt");
    Contact *contactList = loadContactsFromFile("./data/contact.txt");
    Employee *employeeList = loadEmployeesFromFile("./data/employee.txt");
    CommunicationRecord *communicationList = loadCommunicationsFromFile("./data/communication.txt");
    Group *groupList = loadGroupsFromFile("./data/group.txt");

    // ... 这里可以添加主程序的逻辑，例如菜单、用户交互等 ...

    printf("客户通讯录管理系统结束。\n");

    // 程序结束前保存数据到文件
    saveClientsToFile("./data/client.txt", clientList);
    saveContactsToFile("./data/contact.txt", contactList);
    saveEmployeesToFile("./data/employee.txt", employeeList);
    saveCommunicationsToFile("./data/communication.txt", communicationList);
    saveGroupsToFile("./data/group.txt", groupList);

    return 0;
}