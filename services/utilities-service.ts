import {QuestionScaffold} from '../../prendus-question-elements/prendus-question-elements.d';
import {QuestionScaffoldAnswer} from '../../prendus-question-elements/prendus-question-elements.d';
import {GQLRequest} from './graphql-service';

export function getGraphcoolHTTPEndpoint() {
    if (window.process.env.NODE_ENV === 'production') {
        return 'https://api.graph.cool/simple/v1/cj48qaw2u6uyd01411y8gj8fr';
    }
    else {
        return 'https://api.graph.cool/simple/v1/cj8dlzxgn0oyr0144574u2ivb';
    }
}

export function getGraphcoolWebSocketEndpoint() {
    if (window.process.env.NODE_ENV === 'production') {
        return 'wss://subscriptions.us-west-2.graph.cool/v1/cj48qaw2u6uyd01411y8gj8fr';
    }
    else {
        return 'wss://subscriptions.graph.cool/v1/cj8dlzxgn0oyr0144574u2ivb';
    }
}

export function getPrendusLTIServerOrigin() {
    if (window.process.env.NODE_ENV === 'production') {
        return 'https://api.prendus.com';
    }
    else {
        return 'http://localhost:5000';
    }
}

export function getPrendusClientOrigin() {
    if (window.process.env.NODE_ENV === 'production') {
        return 'https://prendus.com';
    }
    else {
        return 'http://localhost:8000'
    }
}

export const isDefinedAndNotEmpty = (objects: string | string[]): boolean => {
  if(!objects) {
    return false;
  }

  if(typeof objects === 'string') {
    return objects && objects.trim().length !== 0;
  } else if(Array.isArray(objects) && objects.length > 0) {
    const newObjs: string[] = objects.filter( (obj) => {
      return obj && obj.trim().length > 0;
    });
    // all are defined and not empty
    return newObjs.length === objects.length;
  } else {
    return false;
  }

};

export const getQuestionScaffoldAnswers = (questionScaffold: QuestionScaffold): QuestionScaffoldAnswer[] => {
  return Object.keys(questionScaffold.answers || {}).map((key) => {
      return {
        ...questionScaffold.answers[key],
        id: key
      };
  });
};

export function shuffleArray(array: any[]): any[] {
    const newArray = [...array];
    return newArray.sort((element) => {
        return .5 - Math.random();
    });
}
export function createUUID() {
    //From persistence.js; Copyright (c) 2010 Zef Hemel <zef@zef.me> * * Permission is hereby granted, free of charge, to any person * obtaining a copy of this software and associated documentation * files (the "Software"), to deal in the Software without * restriction, including without limitation the rights to use, * copy, modify, merge, publish, distribute, sublicense, and/or sell * copies of the Software, and to permit persons to whom the * Software is furnished to do so, subject to the following * conditions: * * The above copyright notice and this permission notice shall be * included in all copies or substantial portions of the Software. * * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR * OTHER DEALINGS IN THE SOFTWARE.
	var s: any[] = [];
	var hexDigits = "0123456789ABCDEF";
	for ( var i = 0; i < 32; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	s[12] = "4";
	s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);

	var uuid = s.join("");
	return uuid;
}

export function navigate(redirectUrl: string) {
    window.history.pushState({}, '', redirectUrl);
    window.dispatchEvent(new CustomEvent('location-changed'));
}

//TODO put this into redux somehow. Manage all cookies from Redux. Also, use regex
export function getCookie(name: string) {
    const cookiesObj = document.cookie.split('; ').reduce((result, cookieString) => {
        const cookieArray = cookieString.split('=');
        const key = cookieArray[0];
        const value = cookieArray[1];
        return {
            ...result,
            [key]: value
        };
    }, {});
    return cookiesObj[name];
}

//TODO put this into redux somehow. Manage all cookies from Redux.
export function deleteCookie(name: string) {
    //TODO I am not sure if the domain will work on localhost for testing
    document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname.replace('www', '')}`;
}

export async function asyncMap(collection: any[], behavior: any): Promise<any[]> {
    if (collection.length === 0) {
        return [];
    }

  const obj = await behavior(collection[0]);
  if (collection.length === 1) {
    return [obj];
  }
  return [obj, ...(await asyncMap(collection.slice(1), behavior))];
}

export async function asyncForEach(collection: any[], behavior: any): Promise<void> {
    if (collection.length === 0) {
        return;
    }
    await behavior(collection[0]);
    await asyncForEach(collection.slice(1), behavior);
}

export async function asyncReduce(collection: any[], behavior: any, result: any): Promise<any> {
    return await asyncReduceRecursion(collection, behavior, result, 0);
    async function asyncReduceRecursion(collection: any[], behavior: any, result: any, index: number): Promise<any> {
        if (collection.length === 0) {
            return result;
        }

        const newResult = await behavior(result, collection[0], index);
        return await asyncReduceRecursion(collection.slice(1), behavior, newResult, index + 1);
    }
}

async function isUserOnCourse(userId: string, userToken: string, assignmentId: string) {
    const data = await GQLRequest(`
        query enrolled($assignmentId: ID!, $userId: ID!) {
            Assignment(
                id: $assignmentId
            ) {
                course{
                  author{
                    id
                  }
                  enrolledStudents(
                      filter: {
                          id: $userId
                      }
                  ) {
                      id
                  }
                }
            }
        }
    `, {assignmentId, userId}, userToken, (error: any) => { console.log(error); });
    return !!(data.Assignment.course.enrolledStudents[0] || (data.Assignment.course.author.id === userId));
}

async function hasUserPaidForCourse(userId: string, userToken: string, assignmentId: string, courseId: string) {
    const data = await GQLRequest(`
        query hasPaid($assignmentId: ID!, $userId: ID!) {
            Assignment(
                id: $assignmentId
            ) {
                course{
                  author{
                    id
                  }
                  purchases(
                      filter: {
                          AND: [{
                                  user: {
                                      id: $userId
                                  }
                              }
                          ]
                      }
                  ) {
                      id
                  }
                }
            }
        }
    `, {assignmentId, userId}, userToken, (error: any) => {});
    return !!(data.Assignment.course.purchases[0] || (data.Assignment.course.author.id === userId));
}

export async function getCourseIdFromAssignmentId(assignmentId: string, userToken: string) {
    const data = await GQLRequest(`
        query getCourseId($id: ID!) {
            Assignment(id: $id) {
                id
                course {
                    id
                }
            }
        }
      `,
      {id: assignmentId},
      userToken,
      (error: any) => { console.log(error); }
    );

    return data.Assignment.course.id;
}

export async function isUserAuthorizedOnCourse(userId: string, userToken: string, assignmentId: string, courseId: string): Promise<{ userOnCourse: boolean, userPaidForCourse: boolean }> {
    const userOnCourse = await isUserOnCourse(userId, this.userToken, assignmentId);
    const userPaidForCourse = await hasUserPaidForCourse(userId, userToken, assignmentId, courseId);
    return {
        userOnCourse,
        userPaidForCourse
    };
}

export function fireLocalAction(componentId: string, key: string, value: any) {
    return {
        type: 'SET_COMPONENT_PROPERTY',
        componentId,
        key,
        value
    };
}
