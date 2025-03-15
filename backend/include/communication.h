#ifndef COMMUNICATION_H
#define COMMUNICATION_H

#include "client.h"  // 需要用到 Client 结构体
#include "contact.h" // 需要用到 Contact 结构体
#include "sales.h"   // 需要用到 Employee 结构体

typedef struct CommunicationRecord
{
    int id;
    int client_id;   // 关联客户ID
    int contact_id;  // 关联联络员ID
    int employee_id; // 关联业务员ID
    int year;
    int month;
    int day;
    int hour;
    int minute;
    int second;
    int duration;      // 通信时长，分钟
    char content[500]; // 通信内容
    struct CommunicationRecord *next;
} CommunicationRecord;

#endif