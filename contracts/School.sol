// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract School {
    address public principal;
    string public nameOfSchool; 

    constructor(string memory _nameOfSchool) {
        principal = msg.sender;
        nameOfSchool = _nameOfSchool;
    
    }
    modifier onlyPrincipal() {
        require(msg.sender == principal, "You are not the Principal");
        _; 
    }
    modifier onlyPrincipalOrTeacher() {
        require(msg.sender == principal || teachers[teacherId[msg.sender]].isRegistered, "You are not the Principal or a Teacher");
        _;
        
    }

    uint256 teacherCounter = 1;
    uint256 studentCounter = 1;

    enum feesStatus {
    NotPaid,
    Paid
    }


    struct Teachers {
        uint256 id;
        string teacherName;
        string subject;
        bool isRegistered; 
    }
    mapping (address => uint256) public teacherId;
    mapping (uint256 => Teachers) public teachers;

    function addTeacher(uint256 _id, string memory _teacherName, string memory _subject) public onlyPrincipal {
        teachers[_id] = Teachers(_id, _teacherName, _subject, true);
    }

    function sackTeacher(uint256 _id) public onlyPrincipal {
        require(teachers[_id].isRegistered, "Teacher is not registered");
        delete teachers[_id];
    }

    function searchTeacherbyId(uint256 _id) public view onlyPrincipal returns (string memory, string memory) {
        return (teachers[_id].teacherName, teachers[_id].subject);
    }



    struct Students {
        uint256 id;
        string studentName;
        bool isRegistered;
        address studentwalletAddress;
        feesStatus paymentStatus;
    }
        
    mapping (address => uint256) public StudentsId;
    mapping (uint256 => Students) public students;

    function addStudent(uint256 _id, string memory _studentName, address _studentwalletAdress) public onlyPrincipalOrTeacher{
        require(!students[StudentsId[_studentwalletAdress]].isRegistered, "Student is already registered");
        students[_id] = Students(_id, _studentName, true, _studentwalletAdress, feesStatus.NotPaid);
    }

    function removeStudent(uint256 _id) public onlyPrincipalOrTeacher {
        require(students[_id].isRegistered, "Student is not registered");
        delete students[_id];
    }


}