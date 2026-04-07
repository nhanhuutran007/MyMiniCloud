-- Tạo database
CREATE DATABASE IF NOT EXISTS studentdb;

-- Chọn database
USE studentdb;

-- Tạo bảng students
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(10),
    fullname VARCHAR(100),
    dob DATE,
    major VARCHAR(50)
);

-- Chèn 3 bản ghi
INSERT INTO students (student_id, fullname, dob, major)
VALUES 
    ('ST001', 'Yen Phung', '2000-01-10', 'Computer Networks'),
    ('ST002', 'Van Trong', '2001-02-15', 'Computer Networks'),
    ('ST003', 'Huu Nhan', '2000-11-20', 'Computer Networks');