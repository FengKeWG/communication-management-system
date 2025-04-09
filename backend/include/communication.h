#ifndef COMMUNICATION_H
#define COMMUNICATION_H

#include "client.h"
#include "sales.h"

typedef struct Communication
{
    int id;
    int client_id;  // 关联客户ID
    int contact_id; // 关联联络员ID
    int sales_id;   // 关联业务员ID
    int year;
    int month;
    int day;
    int hour;
    int minute;
    int second;
    int duration;        // 通信时长，分钟
    char content[50000]; // 通信内容
    struct Communication *next;
} Communication;

#endif