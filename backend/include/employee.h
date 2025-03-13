// 业务员信息

typedef struct Employee
{
    int id;
    char name[50];
    int gender[2];
    char birthday[15];
    char email[50];
    int phone_count;
    char phones[100][100];
    struct Employee *next;
} Employee;