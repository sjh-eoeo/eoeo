/**
 * TokAPI 할당량 테스트 스크립트
 * 
 * Usage: node test-tokapi.js
 */

const RAPID_API_KEY = "e11796bc42mshaae0083c233b4a3p103901jsn35d206fe131c";
const RAPID_API_HOST = "tokapi-mobile-version.p.rapidapi.com";

async function testTokAPI() {
  try {
    console.log('🔍 TokAPI 테스트 시작...\n');
    
    // 테스트용 username (charlidamelio - 유명한 TikTok 크리에이터)
    const testUsername = 'charlidamelio';
    
    const url = `https://${RAPID_API_HOST}/v1/user/info?username=${testUsername}`;
    
    console.log(`📡 API 요청: ${url}\n`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': RAPID_API_HOST,
      },
    });
    
    console.log(`✅ 응답 상태: ${response.status} ${response.statusText}\n`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 오류 응답:', errorText);
      console.error('\n💡 할당량 문제일 경우 RapidAPI 대시보드에서 확인하세요:');
      console.error('   https://rapidapi.com/makingdevelopers-t9XqByX_2/api/tokapi-mobile-version/\n');
      return;
    }
    
    const data = await response.json();
    
    console.log('📊 응답 데이터:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data && data.user) {
      const user = data.user;
      console.log('\n✨ 파싱된 사용자 정보:');
      console.log(`  User ID: ${user.id}`);
      console.log(`  Username: @${user.uniqueId}`);
      console.log(`  Nickname: ${user.nickname}`);
      console.log(`  Followers: ${user.stats?.followerCount?.toLocaleString()}`);
      console.log(`  Following: ${user.stats?.followingCount?.toLocaleString()}`);
      console.log(`  Likes: ${user.stats?.heartCount?.toLocaleString()}`);
      console.log(`  Videos: ${user.stats?.videoCount?.toLocaleString()}`);
      console.log(`  Verified: ${user.verified ? 'Yes' : 'No'}`);
      console.log('\n🎉 TokAPI가 정상적으로 작동합니다!');
      console.log('CreatorsPage에서 프로필 링크 입력 시 자동으로 정보를 가져올 수 있습니다.\n');
    } else {
      console.error('❌ 응답 데이터 형식이 예상과 다릅니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('\n💡 문제 해결 방법:');
    console.error('  1. 인터넷 연결 확인');
    console.error('  2. RapidAPI 할당량 확인');
    console.error('  3. API 키가 올바른지 확인\n');
  }
}

testTokAPI();
