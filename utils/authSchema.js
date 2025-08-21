import * as Yup from "yup";
const validationSchema = Yup.object().shape({
    email:Yup.string().required("Email is required").email("Invalid email format."),
    password:Yup.string().required("Password is required").email("Password must be atlest 6 characters long.")
});
export default validationSchema;