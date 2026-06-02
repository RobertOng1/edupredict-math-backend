import axios from "axios";

export const predictStudentMastery = async (
  studentHistory,
  personalPreference
) => {

  const response = await axios.post(
    process.env.AI_API_URL,
    {
      student_history: studentHistory,
      personal_preference: personalPreference
    }
  );

  return response.data;
};