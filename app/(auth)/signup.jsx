import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Formik } from 'formik'
import { ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import validationSchema from '../../utils/authSchema'



const logo = require("../../assets/images/dinetimelogo.png")
const entryImg = require('../../assets/images/Frame.png')



const Signup = () => {
  const router = useRouter()
  const handleSignup = (values) => {
    console.log("Form values:", values)
    // your signup logic here
  }

  return (
    <SafeAreaView className="bg-[#2b2b2b] flex-1">
      <StatusBar barStyle="light-content" backgroundColor="#2b2b2b" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        
        {/* Logo + Title */}
        <View className="m-2 flex justify-center items-center">
          <Image source={logo} style={{ width: 300, height: 120 }} />
          <Text className="text-xl text-center text-[#f49b33] font-bold mb-10">
            Let's get you started
          </Text>
        </View>

        {/* Form */}
        <View className="w-5/6 self-center">
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSignup}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View className="w-full">
                {/* Email */}
                <Text className="text-[#f49b33] mb-2">Email</Text>
                <TextInput
                  className="h-12 border border-white text-white rounded px-3"
                  keyboardType="email-address"
                  onChangeText={handleChange("email")}
                  value={values.email}
                  onBlur={handleBlur("email")}
                  placeholder="Enter your email"
                  placeholderTextColor="#aaa"
                />
                {touched.email && errors.email && (
                  <Text className="text-red-500 text-xs mb-2">{errors.email}</Text>
                )}

                {/* Password */}
                <Text className="text-[#f49b33] mt-4 mb-2">Password</Text>
                <TextInput
                  className="h-12 border border-white text-white rounded px-3"
                  secureTextEntry
                  onChangeText={handleChange("password")}
                  value={values.password}
                  onBlur={handleBlur("password")}
                  placeholder="Enter your password"
                  placeholderTextColor="#aaa"
                />
                {touched.password && errors.password && (
                  <Text className="text-red-500 text-xs mb-2">{errors.password}</Text>
                )}

                {/* Submit */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  className="p-2 my-2 bg-[#f49b33] rounded-lg mt-7"
                >
                  <Text className="text-xl font-semibold text-center text-black">
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
          <View>
            <TouchableOpacity className='flex flex-row justify-center my-2 p-2 items-center' onPress={()=>router.push("/signin")}>
                    <Text className='text-white font font-semibold'>
                      Already a User?{" "}
                    </Text>
                    <Text className='text-base font-semibold underline text-[#f49b33] text-center'>Sign In</Text>
                </TouchableOpacity>
                <Text className='text-center text-xl font-semibold my-0 text-white' >
                  <View className="border-b-2 border-[#f49b33] p-2 mb-1 w-24" /> or{""} 
                  <View className="border-b-2 border-[#f49b33] p-2 mb-1 w-24"/>
                </Text>
                 <TouchableOpacity className='flex flex-row justify-center my-2 p-2 items-center' onPress={()=>router.push("/home")}>
                    <Text className='text-white font font-semibold'>
                      Be a{" "}
                    </Text>
                    <Text className='text-base font-semibold underline text-[#f49b33] text-center'>Guest User</Text>
                </TouchableOpacity>
          </View>
        </View>

        {/* Entry Image */}
        <View className="flex-1 items-center mt-6">
          <Image
            source={entryImg}
            style={{ width: "100%", height: 300 }}
            contentFit="contain"
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

export default Signup
