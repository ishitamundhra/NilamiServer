/* make api for bidding*/

const db = require('./db');
const helper = require('../helper');
const bcrypt = require('bcrypt');
const config = require('../config');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

async function signUp(req, res) {
	let hashedPassword = await bcrypt.hash(req.body.password, 10);

	const inputData = {
		name: req.body.name,
		email: req.body.email,
		password: hashedPassword,
		primary_number: req.body.primary_number,
		address: req.body.address,
		address_id: uuidv4(),
		city: req.body.address,
		pincode: req.body.pincode,
		mobile: req.body.mobile,
		user_id: uuidv4(),
		username: req.body.email.substring(0, req.body.email.lastIndexOf('@')),
	};
	console.log(inputData);
	try {
		const rows = await db.query(
			`SELECT * FROM user_data WHERE email='${inputData.email}'`
		);
		if (rows.length >= 1) {
			return res.status(500).json({
				error: 'exist',
			});
		} else {
			const payload = {
				user_id: inputData.user_id,
				username: inputData.username,
				email: inputData.email,
			};
			let insertQuery = `INSERT INTO 
								user_data(user_id,user_name, email, password, name, primary_mobile) 
								VALUES ('${inputData.user_id}','${inputData.username}', '${inputData.email}', '${inputData.password}', '${inputData.name}', '${inputData.primary_number}')`;
			let addressQuery = `INSERT INTO 
								user_address(address_id,user_id,address,city,pincode,mobile) 
								VALUES('${inputData.address_id}','${inputData.user_id}','${inputData.address}','${inputData.city}','${inputData.pincode}','${inputData.mobile}')`;
			await db.query(insertQuery);
			await db.query(addressQuery);
			res.cookie(
				'token',
				jwt.sign(payload, config.jwt.secret)
			);
			return res.status(200).json({
				success: 1,
				message: 'successfully signed up',
				user_id: `${inputData.user_id}`
			});
			
		} 
	}catch (error) {
		console.log(error);
		return res.json({
			success: 0,
			message: `${error}`,
		});
	}
}

async function login(req, res) {
	const email = req.body.email;
	const password = req.body.password;
	try {
		const row = await db.query(
			`SELECT * FROM user_data WHERE email='${email}'`
		);
		console.log(row);
		if (row.length == 0) {
			return res.status(404).json({
				error: "user with this email doesn't exist",
			});
		} else {

			/*DO NOT REMOVE THIS CODE */

			// bcrypt
			// 	.compare(password, row[0].password)
			// 	.then((isCorrect) => {
			// 		if (isCorrect) {
			// 			const payload = {
			// 				user_id: row[0].user_id,
			// 				username: row[0].user_name,
			// 				email: row[0].email,
			// 			};
			// 			res.cookie(
			// 				'token',
			// 				jwt.sign(payload, config.jwt.secret, { expiresIn: 3600 })
			// 			);
			// 			return res.status(501).json({
			// 				success: 1,
			// 				message: 'successfully signed up',
			// 			});
			// 		} else {
			// 			res.status(400).json({ passworderror: 'password is not correct' });
			// 		}
			// 	})
			// 	.catch((err) => console.log(err));
			console.log(row);
			if(password == row[0].password){
				const payload = {
					user_id: row[0].user_id,
					username: row[0].user_name,
					email: row[0].email,
				};
				console.log("Babitha");
				console.log(config.jwt.secret);
				res.cookie(
					'token',
					jwt.sign(payload, config.jwt.secret)
				);
				return res.status(200).json({
					success: 1,
					message: 'successfully login',
					user_id: `${row[0].user_id}`
				});
			}
		}
	} catch (error) {
		console.log(error);
		return res.json({
			success: 0,
			message: `${error}`,
		});
	}
}

/* update user info api */
async function updateUserInfo(req,res) {
	let updatedData = {
		name : req.body.name,
		email : req.body.email,
		primary_mobile : req.body.primary_mobile,
		profile_pic: req.body.profile_pic
	};
	let updateQuery = `UPDATE user_data 
						SET email='${updatedData.email}', 
					    name='${updatedData.name}', 
						primary_mobile='${updatedData.primary_mobile}', 
						profile_pic='${updatedData.profile_pic}' 
						WHERE user_name='${req.user.username}'`;
	try {
		await db.query(updateQuery);
		return res.status(200).json({
			success: 1,
			message: 'successfully updated',
		});
	} catch (error) {
		console.log(error);
		return res.json({
			success: 0,
			message: `${error}`,
		});
	}
}

async function addUserAddress(req,res){
	let newAddress = {
		address: req.body.address,
		city: req.body.city,
		pincode: req.body.pincode,
		mobile: req.body.mobile,
		address_id: uuidv4()
	}
	let addressQuery = `INSERT INTO 
						user_address(address_id,user_id,address,city,pincode,mobile) 
						VALUES('${newAddress.address_id}','${req.user.user_id}','${newAddress.address}','${newAddress.city}','${newAddress.pincode}','${newAddress.mobile}')`;
	try {
		await db.query(addressQuery);
		return res.status(200).json({
			success: 1,
			message: 'successfully added address',
		});
	} catch (error) {
		console.log(error);
		return res.json({
			success: 0,
			message: `${error}`,
		});
	}
}

async function deleteUserAddress(req,res){
	const address_id = req.body.address_id;
	let addressQuery = `DELETE FROM user_address WHERE address_id='${address_id}'`;
	try {
		await db.query(addressQuery);
		return res.status(200).json({
			success: 1,
			message: 'successfully deletd address',
		});
	} catch (error) {
		console.log(error);
		return res.json({
			success: 0,
			message: `${error}`,
		});
	}
}

/* get user details api */
async function getUserDetails(req,res) {
	console.log(req.user);
	let userInfoQuery = `SELECT * FROM user_data WHERE user_name='${req.user.username}'`;
	let userAddressQuery =`SELECT * FROM user_address WHERE user_id='${req.user.user_id}'`;

	try {
		const userArray = await db.query(userInfoQuery);
		const userAddressArray = await db.query(userAddressQuery);
		const user = userArray[0];
		return res.status(200).json({
			success: 1,
			userData: {user},
			userAddress: userAddressArray
		});
	} catch (error) {
		console.log(error);
		return res.json({
			success: 0,
			message: `${error}`,
		});
	}
}

/* get user registered auctions(upcoming, completed, ongoing) */
async function getRegisteredAuctions(req,res) {
	const user_id = req.user.user_id;
	let getRegisteredAuctionQuery = `SELECT auction_id FROM user_auction_reg WHERE user_id='${user_id}'`;
	try {
		const registeredEvents = await db.query(getRegisteredAuctionQuery);
		return res.status(200).json({
			success:1,
			registeredEvents: registeredEvents
		});
	} catch (error) {
		console.log(error);
		return res.json({
			success: 0,
			message: `${error}`,
		});
	}
}
/* get user's orgainsed auctions */
async function getMyAuctions(req,res) {
	const user_id = req.user.user_id;
	let getMyAuctionsQuery = `SELECT * 
							FROM auction 
							INNER JOIN product ON auction.product_id=product.product_id 
							WHERE auctioneer_id='${user_id}'`;
	try {
		const myAuctions = await db.query(getMyAuctionsQuery);
		return res.status(200).json({
			success:1,
			myAuctions: myAuctions
		});
	} catch (error) {
		console.log(error);
		return res.json({
			success: 0,
			message: `${error}`,
		});
	}
}

/* user register auction */
async function registerForAuction(req,res) {
	const auction_id = req.body.auction_id;
	const user_id = req.user.user_id;
	let insertQuery = `INSERT INTO user_auction_reg(user_id, auction_id) values ('${user_id}','${auction_id}')`;
	try {
		await db.query(insertQuery);
		return res.status(200).json({
			success: 1,
			message : "successfully registered"
		});
	} catch (error) {
		console.log(error);
		return res.json({
			success: 0,
			message: `${error}`,
		});
	}
}

/* user unregister auction */
async function unregisterForAuction(req,res) {
	const auction_id = req.body.auction_id;
	const user_id = req.user.user_id;
	let deleteQuery = `DELETE FROM user_auction_reg WHERE user_id='${user_id}' AND auction_id='${auction_id}'`;
	try {
		await db.query(deleteQuery);
		return res.status(200).json({
			success: 1,
			message : "successfully unregistered"
		});
	} catch (error) {
		console.log(error);
		return res.json({
			success: 0,
			message: `${error}`,
		});
	}
}

/* user bidding in an auction */
async function bid(req,res) {
	const auction_id = req.params.auction_id;
	const bidValue = req.body.bidValue;
	let getTopBids = `SELECT * FROM auction_bid_details WHERE auction_id='${auction_id}'`;
	try {
		let bidDetails = (await db.query(getTopBids))[0];
		if(!bidDetails){
			console.log("dd");
			const insertBidQuery = `INSERT INTO auction_bid_details VALUES('${auction_id}','0','0','0')`;
			await db.query(insertBidQuery);
			bidDetails = (await db.query(getTopBids))[0];
			console.log(bidDetails);
		}
		if(bidValue > bidDetails.highest_bid){
			const updateBidQuery = `UPDATE auction_bid_details SET 
									highest_bid='${bidValue}', 
									second_highest_bid='${bidDetails.highest_bid}', 
									third_highest_bid='${bidDetails.second_highest_bid}' 
									WHERE auction_id ='${auction_id}'`;
			const updateWinnerQuery =`UPDATE auction SET winner_user_id='${req.user.user_id}'`;

			await db.query(updateBidQuery);
			await db.query(updateWinnerQuery);
			return res.status(200).json({
				success: 1,
				message : "successful bid"
			});

		}else{
			return res.json({
				success: 0,
				message : "your bid is less than than the highest bid"
			});
		}
	} catch (error) {
		console.log(error);
		return res.json({
			success: 0,
			message: `${error}`,
		});
	}
}

async function allUsers(req, res) {
	// console.log(req.user);
	let userInfoQuery = `SELECT * FROM user_data`;

	try {
		const userArray = await db.query(userInfoQuery);
		console.log(userArray);
		return res.status(200).json({
			success: 1,
			userData: {userArray},
		});
	} catch (error) {
		console.log(error);
		return res.json({
			success: 0,
			message: `${error}`,
		});
	}
}


module.exports = {
	signUp,
	login,
	getUserDetails,
	updateUserInfo,
	registerForAuction,
	unregisterForAuction,
	addUserAddress,
	deleteUserAddress,
	getRegisteredAuctions,
	bid,
	getMyAuctions,
	allUsers
};