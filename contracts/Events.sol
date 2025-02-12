// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

import "./Erc721.sol";

contract EventContract {
    enum EventType {
        free,
        paid
    }

    event EventCreated(uint256 _id, address _organizer);
    event TicketPurchased(uint256 _id, address _attendee);
    event AttendanceVerified(uint256 _id, address _attendee);

    struct EventDetails {
        string _title;
        string _description;
        uint256 _startDate;
        uint256 _endDate;
        EventType _type;
        uint32 _expectedGuestCount;
        uint32 _registeredGuestCount;
        uint32 _verifiedGuestCount;
        address _organizer;
        address _ticketAddress;
        uint256 _ticketPrice; // Added ticket price for paid events
    }

    uint256 public event_count;
    mapping(uint256 => EventDetails) public events;
    mapping(address => mapping(uint256 => bool)) hasRegistered;
    mapping(uint256 => mapping(address => bool)) hasVerified;

    modifier onlyOrganizer(uint256 _eventId) {
        require(msg.sender == events[_eventId]._organizer, "ONLY ORGANIZER ALLOWED");
        _;
    }

    function createEvent(
        string memory _title,
        string memory _desc,
        uint256 _startDate,
        uint256 _endDate,
        EventType _type,
        uint32 _egc,
        uint256 _ticketPrice 
    ) external {
        require(_startDate > block.timestamp, "Future dates only");
        require(_startDate < _endDate, "End date must greater than start date");
        require(_type == EventType.free || _ticketPrice > 0, "INVALID TICKET PRICE");
        
        uint256 _eventId = event_count + 1;
        events[_eventId] = EventDetails({
            _title: _title,
            _description: _desc,
            _startDate: _startDate,
            _endDate: _endDate,
            _type: _type,
            _expectedGuestCount: _egc,
            _registeredGuestCount: 0,
            _verifiedGuestCount: 0,
            _organizer: msg.sender,
            _ticketAddress: address(0),
            _ticketPrice: _ticketPrice
        });

        event_count = _eventId;
        emit EventCreated(_eventId, msg.sender);
    }

    function createEventTicket(uint256 _eventId, string memory _ticketname, string memory _ticketSymbol) 
        external onlyOrganizer(_eventId) {
        require(events[_eventId]._ticketAddress == address(0), "TICKET ALREADY CREATED");
        
        Erc721 newTicket = new Erc721(_ticketname, _ticketSymbol);
        events[_eventId]._ticketAddress = address(newTicket);
    }

    function registerForEvent(uint256 _event_id) external payable {
        require(_event_id > 0 && _event_id <= event_count, "EVENT DOES NOT EXIST");
        EventDetails storage _eventInstance = events[_event_id];
        
        require(block.timestamp < _eventInstance._endDate, "EVENT ENDED");
        require(_eventInstance._registeredGuestCount < _eventInstance._expectedGuestCount, "REGISTRATION CLOSED");
        require(!hasRegistered[msg.sender][_event_id], "ALREADY REGISTERED");
        
        if (_eventInstance._type == EventType.paid) {
            require(msg.value == _eventInstance._ticketPrice, "INCORRECT PAYMENT");
            payable(_eventInstance._organizer).transfer(msg.value);
        }

        hasRegistered[msg.sender][_event_id] = true;
        _eventInstance._registeredGuestCount++;

        if (_eventInstance._ticketAddress != address(0)) {
            Erc721(_eventInstance._ticketAddress).mintNFT(msg.sender);
        }

        emit TicketPurchased(_event_id, msg.sender);
    }

    function checkHasRegistered(address _attendee, uint256 _eventId) public view returns (bool) {
        return hasRegistered[_attendee][_eventId];
    }

    function verifyAttendance(uint256 _eventId, address _attendee) external onlyOrganizer(_eventId) {
        require(hasRegistered[_attendee][_eventId], "NOT REGISTERED");
        require(!hasVerified[_eventId][_attendee], "ALREADY VERIFIED");

        hasVerified[_eventId][_attendee] = true;
        events[_eventId]._verifiedGuestCount++;

        emit AttendanceVerified(_eventId, _attendee);
    }

    function checkHasVerified(uint256 _eventId, address _attendee) public view returns (bool) {
    return hasVerified[_eventId][_attendee];
}
}
