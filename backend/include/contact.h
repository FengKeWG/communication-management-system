typedef struct Contact
{
    int id;
    int client_id;     // 客户
    char name[50];     // WindGuest
    int gender[2];     // 0 / 1
    char birthday[15]; // 2005-01-20
    char email[100];
    int phone_count;
    char phones[100][100];
    struct Contact *next;
} Contact;