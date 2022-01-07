import express from "express";
import { MongoClient } from "mongodb";
import cors from 'cors';
import dotenv from 'dotenv'

// create new express app and save it as "app"
const app = express();

dotenv.config();
app.use(express.json());
app.use(cors())

// server configuration
const PORT = process.env.PORT;

// make the server listen to requests
app.listen(PORT, () => {
  console.log(`App is Running in Port :` + PORT);
});

// create a route for the app
app.get("/", (req, res) => {
  res.send("Welcome to ZHSS");
});

const MONGO_URL = process.env.MONGO_URL;

//connecting mongodb
async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("MongoDB is Started");
  return client;
}

const client = await createConnection();

//to get mentor details
app.get("/mentor", async (req, res) => {
  const data = await client.db("ZHSS").collection("mentor").find().toArray();
  console.log(data)
  data
    ? res.status(200).send(data)
    : res.status(400).send({ Message: "Data not Found" });
});

//to get student Details
app.get("/student", async (req, res) => {
  const data = await client.db("ZHSS").collection("student").find().toArray();
  data
    ? res.status(200).send(data)
    : res.status(500).send({ Message: "Data Not Found" });
});

// Creating mentor
app.post("/create-mentor", async (req, res) => {
  const new_mentor_data = await client.db("ZHSS").collection("mentor").insertOne(req.body);
  new_mentor_data
    ? res.status(200).send({ Message: "Mentor created" })
    : res.status(500).send({ Message: "Internal Server Error" });
});

//create a student data
app.post("/create-student", async (req, res) => {
    const new_student_data = await client.db("ZHSS").collection("student").insertOne(req.body);
    new_student_data
    ? res.status(200).send({ Message: "Student Created"})
    : res.status(500).send({ Message: "Internal Server Erorr" });
});

//to assign student for the mentor
app.put("/assign-student", async (req, res) => {
  const { mentorName, studentsAssigned } = req.body;
  const mentors = await client
    .db("ZHSS")
    .collection("mentors")
    .updateOne(
      { mentorName: mentorName },
      { $set: { studentsAssigned: studentsAssigned } }
    );

  const studentName = studentsAssigned.map((stu) => {
    console.log(stu, mentorName);
    const student = client
      .db("ZHSS")
      .collection("students")
      .updateOne(
        { studentName: stu },
        { $set: { mentorAssigned: mentorName } }
      );
  });
  
  res.send({ Msg: "Database Updated Successfully" });
});

// to assign mentor for the student
app.put("/assign-mentor", async (req, res) => {
  const { studentName, mentorAssigned } = req.body;
  const mentor = await client
    .db("ZHSS")
    .collection("students")
    .updateOne(
      { studentName: studentName },
      { $set: { mentorAssigned: mentorAssigned } }
    );

  const students = await client
    .db("ZHSS")
    .collection("mentors")
    .findOneAndUpdate(
      { mentorName: mentorAssigned },
      {
        $addToSet: {
          studentsAssigned: studentName,
        },
      }
    );

  res.send({ Msg: "Database Updated Successfully" });
});