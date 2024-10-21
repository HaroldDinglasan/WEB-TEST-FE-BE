import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import '../styles/CreateAccount.css';

import { FaUser } from "react-icons/fa";
import { TbEyeClosed, TbEyeUp } from "react-icons/tb";
import logo from '../assets/logo.png';

import AddGuestModal from '../component/AddGuestModal';

const RegisterForm = () => {

    const navigate = useNavigate();
    const [userType, setUserType] = useState('student');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        memberNumber: '',
        email: ''
    });
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showGuestModal, setShowGuestModal] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsButtonDisabled(true);
        setIsSubmitting(true);

        // Validations
        if (formData.username === '' || !/^[a-zA-Z0-9]+$/.test(formData.username)) {
            setErrorMessage('Please enter a valid username (use alphanumeric characters only).');
            setIsButtonDisabled(false);
            setIsSubmitting(false);
            return;
        }

        // Check if the username already exists
        try {
            const usernameExists = await Axios.get(`http://localhost:8080/user/exists?username=${formData.username}`);
            if (usernameExists.data) {
                setErrorMessage('USERNAME ALREADY EXISTS.');
                setIsButtonDisabled(false);
                setIsSubmitting(false);
                return;
            }
        } catch (error) {
            console.error('Error checking username existence:', error);
        }

        if (formData.password === '') {
            setErrorMessage('Please Enter a Password.');
            setIsButtonDisabled(false);
            setIsSubmitting(false);
            return;
        }

        if (userType !== 'guest' && formData.memberNumber === '') {
            setErrorMessage('Please Enter your Member Number.');
            setIsButtonDisabled(false);
            setIsSubmitting(false);
            return;
        }

        if (userType !== 'guest' && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
            setErrorMessage('Please Enter a valid Email Address.');
            setIsButtonDisabled(false);
            setIsSubmitting(false);
            return;
        }

        if (userType === 'guest') {
            setShowGuestModal(true);
            setIsButtonDisabled(false);
            setIsSubmitting(false);
        } else {
            try {
                const payload = {
                    user: {
                        username: formData.username,
                        password: formData.password
                    },
                    [userType]: {
                        [userType === 'student' ? 'studentNumber' : 'employeeNumber']: formData.memberNumber,
                        email: formData.email
                    }
                };

                const response = await Axios.post('http://localhost:8080/user/register', payload);

                if (response.status === 200) {
                    navigate('/account/otp');
                } else if (response.data) {
                    setErrorMessage(response.data.message || 'An error occurred.');
                }
            } catch (error) {
                console.error('Error:', error);
                if (error.response && error.response.data && error.response.data.message) {
                    setErrorMessage(error.response.data.message);
                } else {
                    setErrorMessage('An error occurred while processing your request.');
                }
            }
            setIsButtonDisabled(false);
            setIsSubmitting(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword); 
    };

    const handleSubmitGuest = async (guestData) => {
        try {
            const guestNumber = `GUEST_${Math.floor(1000 + Math.random() * 9000)}`;
            const guestResponse = await Axios.post('http://localhost:8080/guest/addGuest', {
                guestData: { ...guestData, guestNumber }
            });

            if (guestResponse.status === 200) {
                const loginPayload = {
                    username: formData.username,
                    password: formData.password,
                    guest: { guestNumber }
                };

                const loginResponse = await Axios.post('http://localhost:8080/user/register', loginPayload);

                if (loginResponse.status === 200) {
                    setShowGuestModal(false);
                    navigate('/login');
                } else {
                    setErrorMessage('Failed to register guest in the Login table.');
                }
            } else {
                setErrorMessage('Failed to save guest details to the Guest table.');
            }
        } catch (error) {
            setErrorMessage('An error occurred during guest registration.');
        }
    };
    

    return (
        <div className="create-account-container">
            <div className="form-box-register">
                <div className="header">
                    <div className="logo">
                        <img src={logo} alt="Logo" id="logo"/>
                    </div>
                    <h1>Register</h1>
                </div>
                <form onSubmit={handleSubmit} className="form-container">
                    <div className="input-box">
                        <label>User Type:</label>
                        <select
                            name="userType"
                            value={userType}
                            onChange={(e) => setUserType(e.target.value)}
                            className="select-style"
                        >
                            <option value="student">Student</option>
                            <option value="employee">Employee</option>
                            <option value="external">External</option>
                            <option value="guest">Guest</option>
                        </select>
                    </div>

                    <div className="input-box">
                        <label>Username:</label>
                        <div className="insert">
                            <input type="text" name="username" value={formData.username} onChange={handleChange} />
                            <FaUser className="icon" />
                        </div>
                        {errorMessage === 'USERNAME ALREADY EXISTS.' && <p className="error-message">{errorMessage}</p>}
                    </div>

                    <div className="input-box">
                        <label>Password</label>
                        <div className="insert">
                            <input type={showPassword ? "text" : "password"} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                            {showPassword ? (
                                <TbEyeUp className="icon" onClick={togglePasswordVisibility} />
                            ) : (
                                <TbEyeClosed className="icon" onClick={togglePasswordVisibility} />
                            )}
                        </div>  
                    </div>

                    {userType !== 'guest' && (
                        <div className="input-box">
                            <label>{userType === 'student' ? 'Student Number:' : 'Employee Number:'}</label>
                            <input type="text" name="memberNumber" value={formData.memberNumber} onChange={handleChange} />
                        </div>
                    )}

                    {userType !== 'guest' && (
                        <div className="input-box">
                            <label>Email:</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} />
                        </div>
                    )}

                    <button type="submit" disabled={isButtonDisabled || isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Register'}
                    </button>
                </form>
            </div>
            {showGuestModal && <AddGuestModal onClose={() => setShowGuestModal(false)} onSubmit={handleSubmitGuest} />}
        </div>
    );
};

export default RegisterForm;
