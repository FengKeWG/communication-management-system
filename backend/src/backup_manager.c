#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sys/stat.h>
#include <unistd.h>
#include <errno.h>
#include <windows.h>
#include <direct.h>
#include "../include/backup_manager.h"
#include "../include/utils.h"

// Windows下mkdir的兼容性定义
#ifndef mkdir
#define mkdir(path) _mkdir(path)
#endif

const char *parseAndFormatBackupTimestamp(const char *filename)
{
    // 静态缓冲区存储结果，每次调用会覆盖上次结果
    static char formatted_time[30];
    int year, month, day, hour, minute, second;
    size_t len = strlen(filename);

    // 检查基本格式和后缀
    // 文件名至少需要 "backup_YYYYMMDD_HHMMSS.zip" 的长度
    const char *expected_prefix = "backup_";
    const char *expected_suffix = ".zip";
    size_t prefix_len = strlen(expected_prefix);
    size_t suffix_len = strlen(expected_suffix);
    size_t expected_min_len = prefix_len + 8 /*YYYYMMDD*/ + 1 /*_*/ + 6 /*HHMMSS*/ + suffix_len;

    if (len < expected_min_len || strncmp(filename, expected_prefix, prefix_len) != 0 || strcmp(filename + len - suffix_len, expected_suffix) != 0)
    {
        strcpy(formatted_time, "格式错误");
        return formatted_time;
    }

    // 尝试从特定位置解析日期和时间数字
    // YYYYMMDD 在 prefix_len 之后
    // HHMMSS 在 prefix_len + 8 + 1 之后
    if (sscanf(filename + prefix_len, "%4d%2d%2d_%2d%2d%2d",
               &year, &month, &day, &hour, &minute, &second) == 6)
    {
        // 基本的有效性检查 (可以根据需要做得更严格)
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 &&
            hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59)
        {
            // 格式化为 "YYYY-MM-DD HH:MM:SS"
            sprintf(formatted_time, "%04d-%02d-%02d %02d:%02d:%02d",
                    year, month, day, hour, minute, second);
            return formatted_time;
        }
        else
        {
            strcpy(formatted_time, "日期无效"); // 解析出的数字范围不对
            return formatted_time;
        }
    }

    // 如果 sscanf 失败
    strcpy(formatted_time, "无法解析");
    return formatted_time;
}

int createBackup()
{
    time_t now = time(NULL);
    struct tm *t = localtime(&now);
    char timestamp[20];
    strftime(timestamp, sizeof(timestamp), "%Y%m%d_%H%M%S", t);

    // 确保备份目录存在
    if (access("./backups", F_OK) == -1)
    {
        if (mkdir("./backups") != 0)
        {
            fprintf(stderr, "无法创建备份目录 './backups': %s\n", strerror(errno));
            return -1;
        }
    }
    char backup_filename[FILENAME_MAX];
    snprintf(backup_filename, sizeof(backup_filename), ".\\backups\\backup_%s.zip", timestamp);

    // PowerShell 命令
    char command[PATH_MAX * 2];
    snprintf(command, sizeof(command), "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Compress-Archive -Path .\\data\\* -DestinationPath '%s' -Force\"", backup_filename);

    int result = system(command);

    if (result == 0)
    {
        printf("备份成功创建: %s\n", backup_filename);
        return 0;
    }
    else
    {
        fprintf(stderr, "备份命令执行失败，返回码: %d\n", result);
        // 尝试删除可能不完整的备份文件
        if (access(backup_filename, F_OK) == 0)
            remove(backup_filename);
        return -1;
    }
}

int listBackups()
{
    WIN32_FIND_DATA findData;
    HANDLE hFind;
    char searchPath[MAX_PATH];
    int count = 0;
    if (access("./backups", F_OK) == -1)
    {
        if (mkdir("./backups") != 0)
        {
            fprintf(stderr, "无法创建备份目录 './backups': %s\n", strerror(errno));
            return -1;
        }
    }
    snprintf(searchPath, MAX_PATH, ".\\backups\\backup_*.zip");
    hFind = FindFirstFile(searchPath, &findData);
    if (hFind == INVALID_HANDLE_VALUE)
    {
        if (GetLastError() == ERROR_FILE_NOT_FOUND)
        {
            return 0;
        }
        fprintf(stderr, "查找备份文件失败: %lu\n", GetLastError());
        return -1;
    }
    do
    {
        if (!(findData.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY))
        {
            const char *formatted_timestamp = parseAndFormatBackupTimestamp(findData.cFileName);
            printf("%s|%s\n", findData.cFileName, formatted_timestamp);
            count++;
        }
    } while (FindNextFile(hFind, &findData));
    FindClose(hFind);
    return 0;
}

int deleteBackup(const char *backup_filename)
{
    if (backup_filename == NULL || strstr(backup_filename, "/") != NULL || strstr(backup_filename, "\\") != NULL || strcmp(backup_filename, ".") == 0 || strcmp(backup_filename, "..") == 0)
    {
        fprintf(stderr, "无效或不安全的备份文件名: %s\n", backup_filename ? backup_filename : "(null)");
        return 0;
    }
    char full_path[PATH_MAX];
    snprintf(full_path, sizeof(full_path), "%s/%s", "./backups", backup_filename);
    if (access(full_path, F_OK) == -1)
    {
        fprintf(stderr, "备份文件不存在: %s\n", full_path);
        return -1;
    }
    if (remove(full_path) == 0)
    {
        printf("备份文件已删除: %s\n", backup_filename);
        return 0;
    }
    else
    {
        fprintf(stderr, "删除备份文件失败: %s\n", full_path);
        return -1;
    }
}

int restoreBackup(const char *backup_filename)
{
    if (backup_filename == NULL || strstr(backup_filename, "/") != NULL ||
        strstr(backup_filename, "\\") != NULL || strcmp(backup_filename, ".") == 0 ||
        strcmp(backup_filename, "..") == 0 ||
        (strlen(backup_filename) < 5 || strcmp(backup_filename + strlen(backup_filename) - 4, ".zip") != 0))
    {
        fprintf(stderr, "无效或不安全的备份文件名 (必须是 .zip 文件): %s\n", backup_filename ? backup_filename : "(null)");
        return -1;
    }
    char backup_filepath[PATH_MAX];
    snprintf(backup_filepath, sizeof(backup_filepath), ".\\backups\\%s", backup_filename);
    if (access(backup_filepath, F_OK) == -1)
    {
        fprintf(stderr, "备份文件不存在: %s\n", backup_filepath);
        return -1;
    }
    if (access("./data", F_OK) == -1)
    {
        if (mkdir("./data") != 0)
        {
            fprintf(stderr, "无法创建数据目录 './data': %s\n", strerror(errno));
            return -1;
        }
    }
    char command[PATH_MAX * 2];
    snprintf(command, sizeof(command), "rd /s /q .\\data && md .\\data");
    printf("正在清空并重建数据目录 %s ... 命令: %s\n", "./data", command);
    int result = system(command);
    printf("数据目录 %s 已准备好进行恢复。\n", "./data");
    snprintf(command, sizeof(command), "powershell -NoProfile -ExecutionPolicy Bypass -Command \"Expand-Archive -Path '%s' -DestinationPath .\\data -Force\"",
             backup_filepath);
    printf("执行恢复命令: %s\n", command);
    result = system(command);
    if (result == 0)
    {
        printf("从备份 %s 恢复成功。\n", backup_filename);
        return 0;
    }
    else
    {
        fprintf(stderr, "恢复命令 (PowerShell Expand-Archive) 执行失败，返回码: %d\n", result);
        return -1;
    }
}