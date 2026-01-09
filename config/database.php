<?php
/**
 * Database Connection Handler
 */

class Database {
    private $conn;
    
    public function __construct() {
        try {
            $this->conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
            
            if ($this->conn->connect_error) {
                throw new Exception('Database connection failed: ' . $this->conn->connect_error);
            }
            
            $this->conn->set_charset('utf8mb4');
        } catch (Exception $e) {
            die('Connection Error: ' . $e->getMessage());
        }
    }
    
    public function getConnection() {
        return $this->conn;
    }
    
    public function query($sql) {
        return $this->conn->query($sql);
    }
    
    public function prepare($sql) {
        return $this->conn->prepare($sql);
    }
    
    public function close() {
        $this->conn->close();
    }
}
?>
