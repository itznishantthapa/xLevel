import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Profile from "../screens/customer/Profile";
import CustomerTabNavigator from "./CustomerTabNavigator";
import InCategory from "../screens/customer/InCategory";
import EditProfile from "../screens/customer/EditProfile";
import Notify from "../screens/customer/Notify";
import Match from "../screens/customer/Match";
import AccountDeletion from "../screens/customer/AccountDeletion";

import SetupGameInfo from "../screens/customer/SetupGameInfo";
import EditGameInfo from "../screens/customer/EditGameInfo";
import ResultUpload from "../screens/customer/ResultUpload";
import GameRules from "../screens/customer/rules/GameRules";
import RulesList from "../screens/customer/rules/RulesList";
import UserTournament from "../screens/customer/UserTournament";
import AppErrorFallback from "../component/customer/fallback/AppErrorFallback";
import CreateGame from "../screens/customer/createGame/CreateGame";
import EfootballCreate from "../screens/customer/createGame/EfootballCreate";
import CreateChess from "../screens/customer/createGame/CreateChess";
import CreatePubg from "../screens/customer/createGame/CreatePubg";
import CreateMLBB from "../screens/customer/createGame/CreateMLBB";
import Leaderboard from "../screens/customer/Leaderboard";
import ReportUser from "../screens/customer/issue/ReportUser";
import Report from "../screens/customer/Report";
import ReportList from "../screens/customer/report/ReportList";
import Thanks from "../screens/customer/issue/Thanks";
import BlockedUserList from "../screens/customer/BlockedUserList";
import AccessBar from "../screens/customer/AccessBar";
import { Platform } from "react-native";
import PointsOut from "../screens/customer/PointsOut";
import PointsIn from "../screens/customer/PointsIn";
import DynamicIn from "../screens/customer/DynamicIn";
import GamePoints from "../screens/customer/gamepoints/GamePoints";
import Example from "../screens/customer/example/Example";


const Stack = createNativeStackNavigator();


export default function CustomerNavigator(){
    return(
        <>
        <Stack.Navigator  screenOptions={{headerShown:false}}>
            <Stack.Screen component={CustomerTabNavigator} name="customerTabs" />
            <Stack.Screen component={Profile} name="profile" options={{ animation: Platform.OS === 'ios' ? 'slide_from_left' : 'default' }} />
            <Stack.Screen component={EditProfile} name="editProfile"/>
            <Stack.Screen component={InCategory} name="inCategory" options={{ animation: "fade"}}/>
            <Stack.Screen component={CreateGame} name="createGame"/>
            <Stack.Screen component={UserTournament} name="userTournament"/>
            <Stack.Screen component={PointsOut} name="pointsOut"/>
            <Stack.Screen component={PointsIn} name="pointsIn"/>
            <Stack.Screen component={DynamicIn} name="dynamicIn"/>
            <Stack.Screen component={GamePoints} name="gamePoints"/>
            <Stack.Screen component={Match} name="match"/>
            <Stack.Screen component={Notify} name="notify"/>
            <Stack.Screen component={SetupGameInfo} name="setupGameInfo"/>
            <Stack.Screen component={EditGameInfo} name="editGameInfo"/>
            <Stack.Screen component={ResultUpload} name="resultUpload" />
            <Stack.Screen component={GameRules} name="gameRules"/>
            <Stack.Screen component={RulesList} name="rulesList" />
            <Stack.Screen component={AppErrorFallback} name="appErrorFallback"/>
            <Stack.Screen component={EfootballCreate} name="efootballCreate"/>
            <Stack.Screen component={CreateChess} name="createChess"/>
            <Stack.Screen component={CreatePubg} name="createPubg"/>
            <Stack.Screen component={CreateMLBB} name="createMLBB"/>
            <Stack.Screen component={AccountDeletion} name="accountDeletion"/>
            <Stack.Screen component={Leaderboard} name="leaderboard"/>
            <Stack.Screen component={ReportUser} name="reportUser"/>
            <Stack.Screen component={Report} name="report" options={{ animation: "fade"}}/>
            <Stack.Screen component={ReportList} name="reportList" options={{ animation: "fade"}}/>
            <Stack.Screen component={Thanks} name="thanks"/>
            <Stack.Screen component={BlockedUserList} name="blockedUserList"/>
            <Stack.Screen component={AccessBar} name="accessBar"/>
            <Stack.Screen component={Example} name="example"/>
        </Stack.Navigator>
        </>
    );
}