
CREATE DATABASE business_management;
USE business_management;

CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    website VARCHAR(255),
    port INT,
    online_status ENUM('yes', 'no'),
    business_type VARCHAR(255)
);
